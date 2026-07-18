package com.minexpert.hns.service.dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.dashboard.DashboardAlertDTO;
import com.minexpert.hns.dto.dashboard.DashboardOhsDTO;
import com.minexpert.hns.dto.dashboard.DeclaredMetricDTO;
import com.minexpert.hns.dto.dashboard.LabelCountDTO;
import com.minexpert.hns.dto.dashboard.MonthlyPointDTO;
import com.minexpert.hns.dto.risks.RiskOverviewResponse;
import com.minexpert.hns.entity.indicator.HsIndicator;
import com.minexpert.hns.entity.indicator.IndicatorPlan;
import com.minexpert.hns.entity.indicator.IndicatorPlanEntry;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.projection.MonthlyClosureSummary;
import com.minexpert.hns.repository.indicator.HsIndicatorRepository;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.repository.indicator.IndicatorPlanEntryRepository;
import com.minexpert.hns.repository.indicator.IndicatorPlanRepository;
import com.minexpert.hns.repository.nonConformity.NonConformityRepository;
import com.minexpert.hns.repository.projection.IdCount;
import com.minexpert.hns.repository.projection.LabelCount;
import com.minexpert.hns.repository.projection.MonthCount;
import com.minexpert.hns.service.ppe.PpeService;
import com.minexpert.hns.service.risks.RiskService;

import lombok.RequiredArgsConstructor;

/**
 * Implémentation des agrégations du tableau de bord HSE.
 *
 * <p>PRINCIPE DIRECTEUR — cet écran remplace une maquette dont tous les
 * chiffres étaient inventés. Chaque valeur produite ici doit être traçable à
 * une ligne de base de données. Quand la donnée source n'existe pas, on renvoie
 * {@code null} (l'IHM affiche « — ») et surtout PAS {@code 0} : « on ne sait
 * pas » et « il n'y en a pas » sont deux informations différentes, et les
 * confondre est exactement ce qui rendait la maquette trompeuse.</p>
 *
 * <p>Cloisonnement : {@code companyId} est validé/clampé en amont par le
 * CompanyScopeFilter. Toutes les requêtes appelées ici portent le prédicat
 * {@code (:companyId IS NULL OR ... = :companyId)}. Les méthodes d'agrégation
 * historiques d'{@code IncidentDetailRepository} sont volontairement ignorées :
 * elles n'ont ni filtre société ni filtre date (fuite inter-entreprises).</p>
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    /**
     * Seuil de gravité « incident grave ». Aligné sur
     * IncidentRepository.findIncidentsWithSeverityAboveThree (level > 3).
     */
    private static final int SERIOUS_SEVERITY_MIN_LEVEL = 4;

    /** Statuts terminaux : une action close ne peut pas être « en retard ». */
    private static final List<ActionStatus> CLOSED_ACTION_STATUSES = List.of(ActionStatus.COMPLETED,
            ActionStatus.CANCELLED);

    /**
     * Statuts terminaux d'une inspection : rapport figé ou abandon. Inclut les
     * statuts LEGACY COMPLETED / CANCELLED (antérieurs à la refonte du
     * workflow), sans quoi d'anciennes inspections achevées seraient comptées
     * comme « en cours ».
     */
    private static final List<InspectionStatus> CLOSED_INSPECTION_STATUSES = List.of(InspectionStatus.APPROVED,
            InspectionStatus.ARCHIVED, InspectionStatus.COMPLETED, InspectionStatus.CANCELLED);

    /** Code de l'indicateur portant la valeur LTIFR déclarée. */
    private static final String LTIFR_CODE = "LTIFR";

    private final IncidentRepository incidentRepository;
    private final NonConformityRepository nonConformityRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final GeneralInspectionRepository generalInspectionRepository;
    private final HsIndicatorRepository hsIndicatorRepository;
    private final IndicatorPlanRepository indicatorPlanRepository;
    private final IndicatorPlanEntryRepository indicatorPlanEntryRepository;
    private final PpeService ppeService;
    private final RiskService riskService;

    @Override
    public DashboardOhsDTO getOhsDashboard(Long companyId, Integer year) throws HSException {
        int refYear = year != null ? year : LocalDate.now().getYear();

        DashboardOhsDTO dto = new DashboardOhsDTO();
        dto.setYear(refYear);
        dto.setCompanyId(companyId);
        dto.setKpis(buildKpis(companyId, refYear));
        dto.setIncidentsByCategory(toLabelCounts(incidentRepository.findIncidentCountByCategory(refYear, companyId)));
        dto.setIncidentsBySeverity(toLabelCounts(incidentRepository.findIncidentCountBySeverity(refYear, companyId)));
        dto.setMonthlyTrend(buildMonthlyTrend(companyId, refYear));
        dto.setAlerts(buildAlerts(companyId));
        dto.setIncidentsByMine(buildIncidentsByMine(companyId, refYear));
        dto.setRiskByLevel(buildRiskByLevel(companyId));
        dto.setIncidentsByStatus(toLabelCounts(incidentRepository.findIncidentCountByStatus(refYear, companyId)));
        dto.setActions(buildActionsSummary(companyId, refYear));
        dto.setInspections(buildInspectionsSummary(companyId, refYear));
        return dto;
    }

    // ─────────────────── Plans de charge (actions / inspections) ───────────────────

    /**
     * Suivi des actions correctives de l'exercice (ISO 45001 §10.2).
     *
     * <p>Le « clos » est déterminé par {@link #CLOSED_ACTION_STATUSES}, la MÊME
     * liste que celle qui sert à exclure les actions closes du décompte des
     * retards. Une seule définition de « terminal » : deux listes divergentes
     * produiraient un total incohérent avec son propre détail.</p>
     */
    private DashboardOhsDTO.WorkloadSummary buildActionsSummary(Long companyId, int refYear) {
        List<LabelCountDTO> byStatus = toLabelCounts(
                correctiveActionRepository.findActionCountByStatus(refYear, companyId));
        long closed = sumWhereLabelIn(byStatus, CLOSED_ACTION_STATUSES.stream().map(Enum::name).toList());
        long overdue = correctiveActionRepository.countOverdueActionsByYear(refYear, companyId, LocalDate.now(),
                CLOSED_ACTION_STATUSES);
        return buildWorkload(byStatus, closed, overdue);
    }

    /**
     * Suivi de la surveillance planifiée de l'exercice (ISO 45001 §9.1).
     *
     * <p>« Terminal » couvre ici les inspections dont le rapport est figé ou
     * abandonné. Les statuts LEGACY (COMPLETED / CANCELLED, antérieurs à la
     * refonte du workflow) y sont inclus : les ignorer classerait d'anciennes
     * inspections achevées parmi les « en cours » et gonflerait artificiellement
     * la charge restante.</p>
     */
    private DashboardOhsDTO.WorkloadSummary buildInspectionsSummary(Long companyId, int refYear) {
        List<LabelCountDTO> byStatus = toLabelCounts(
                generalInspectionRepository.findInspectionCountByStatus(refYear, companyId));
        long closed = sumWhereLabelIn(byStatus, CLOSED_INSPECTION_STATUSES.stream().map(Enum::name).toList());
        long overdue = generalInspectionRepository.countOverdueInspections(refYear, companyId, LocalDate.now(),
                InspectionStatus.SCHEDULED);
        return buildWorkload(byStatus, closed, overdue);
    }

    /** Assemble la synthèse : total = somme du détail, ouvert = total - clos. */
    private DashboardOhsDTO.WorkloadSummary buildWorkload(List<LabelCountDTO> byStatus, long closed, long overdue) {
        long total = byStatus.stream().mapToLong(row -> row.getCount() != null ? row.getCount() : 0L).sum();
        DashboardOhsDTO.WorkloadSummary summary = new DashboardOhsDTO.WorkloadSummary();
        summary.setTotal(total);
        summary.setClosed(closed);
        summary.setOpen(total - closed);
        summary.setOverdue(overdue);
        summary.setByStatus(byStatus);
        return summary;
    }

    /** Somme des effectifs dont le libellé figure parmi les statuts fournis. */
    private long sumWhereLabelIn(List<LabelCountDTO> rows, List<String> labels) {
        return rows.stream()
                .filter(row -> labels.contains(row.getLabel()))
                .mapToLong(row -> row.getCount() != null ? row.getCount() : 0L)
                .sum();
    }

    // ─────────────────────────── KPI ────────────────────────────

    private DashboardOhsDTO.Kpis buildKpis(Long companyId, int refYear) throws HSException {
        DashboardOhsDTO.Kpis kpis = new DashboardOhsDTO.Kpis();
        kpis.setTotalIncidentsYtd(incidentRepository.countByYearAndCompany(refYear, companyId));
        // Année N-1 fournie BRUTE : c'est l'IHM qui calcule l'évolution. Le
        // serveur ne pré-calcule pas de pourcentage, qui serait indéfini (et
        // donc inventé) si l'année N-1 est vide.
        kpis.setTotalIncidentsPreviousYtd(incidentRepository.countByYearAndCompany(refYear - 1, companyId));
        kpis.setNearMissCount(nonConformityRepository.countNearMissByYear(refYear, companyId));
        kpis.setDaysWithoutSeriousIncident(computeDaysWithoutSeriousIncident(companyId));
        kpis.setLtifr(readDeclaredLtifr(companyId, refYear));
        return kpis;
    }

    /**
     * Jours écoulés depuis le dernier incident grave (gravité >= 4), toutes
     * années confondues.
     *
     * <p>Renvoie {@code null} si AUCUN incident grave n'est enregistré : on ne
     * connaît alors pas la date de référence, donc la métrique est inconnue.
     * Renvoyer 0 laisserait croire qu'un incident grave vient de se produire ;
     * renvoyer un grand nombre serait une invention pure.</p>
     */
    private Integer computeDaysWithoutSeriousIncident(Long companyId) {
        LocalDateTime last = incidentRepository.findLastSeriousIncidentDate(SERIOUS_SEVERITY_MIN_LEVEL, companyId);
        if (last == null) {
            return null;
        }
        long days = ChronoUnit.DAYS.between(last.toLocalDate(), LocalDate.now());
        // Une date de survenue postérieure à aujourd'hui (saisie erronée) est
        // ramenée à 0 plutôt que de produire un compteur négatif absurde.
        return (int) Math.max(0, days);
    }

    /**
     * Lit la valeur DÉCLARÉE du LTIFR. Elle n'est JAMAIS calculée.
     *
     * <p>POURQUOI : LTIFR = (accidents avec arrêt × 1 000 000) / heures
     * travaillées. Le dénominateur — heures travaillées, effectif exposé,
     * pointage — n'existe dans AUCUNE entité du backend HNS. Le calculer
     * supposerait d'inventer ce dénominateur, c'est-à-dire de produire un
     * chiffre faux ayant l'apparence d'une mesure : exactement le défaut de la
     * maquette que cet écran remplace. On se contente donc de restituer la
     * valeur saisie par l'utilisateur dans le module Indicateurs, marquée
     * {@code source = "DECLARED"} pour que l'IHM puisse l'annoncer comme telle.</p>
     *
     * <p>Renvoie {@code null} — donc « — » à l'écran — dans tous les cas où la
     * chaîne indicateur → plan de l'année → entrée avec valeur réelle est
     * incomplète. En vue consolidée (companyId null) on renvoie également null :
     * agréger des LTIFR de plusieurs mines exigerait de les pondérer par leurs
     * heures travaillées respectives, donnée qui n'existe pas.</p>
     */
    private DeclaredMetricDTO readDeclaredLtifr(Long companyId, int refYear) {
        if (companyId == null) {
            return null;
        }
        Optional<HsIndicator> indicator = hsIndicatorRepository.findByCompanyIdAndCodeIgnoreCase(companyId, LTIFR_CODE);
        if (indicator.isEmpty()) {
            return null;
        }
        Optional<IndicatorPlan> plan = indicatorPlanRepository.findByContext(companyId, indicator.get().getId(),
                refYear);
        if (plan.isEmpty()) {
            return null;
        }
        List<IndicatorPlanEntry> entries = indicatorPlanEntryRepository
                .findByPlanIdOrderByPeriodIndexAsc(plan.get().getId());
        // On retient la DERNIÈRE période effectivement renseignée : les périodes
        // à venir n'ont qu'une cible/prévision, pas de réalisé. Une prévision
        // n'est pas une mesure et ne doit donc jamais être affichée comme telle.
        IndicatorPlanEntry lastActual = null;
        for (IndicatorPlanEntry entry : entries) {
            if (entry.getActual() != null) {
                lastActual = entry;
            }
        }
        if (lastActual == null) {
            return null;
        }
        return new DeclaredMetricDTO(lastActual.getActual(), lastActual.getTarget(), "DECLARED",
                lastActual.getPeriodLabel());
    }

    // ──────────────────────── Tendance mensuelle ─────────────────────────

    /**
     * Courbe incidents + presqu'accidents sur 12 mois.
     *
     * <p>Les deux requêtes ne renvoient QUE les mois porteurs de données : les
     * mois manquants sont complétés à 0. Ici 0 est un fait vérifié (« aucun
     * événement enregistré ce mois-là »), pas un bouchon — contrairement aux KPI
     * sans source, qui restent null.</p>
     */
    private List<MonthlyPointDTO> buildMonthlyTrend(Long companyId, int refYear) {
        Map<Integer, Long> incidentsByMonth = incidentRepository
                .findMonthlyClosureSummaryByYear(refYear, companyId)
                .stream()
                .filter(s -> s.getMonth() != null)
                .collect(Collectors.toMap(MonthlyClosureSummary::getMonth,
                        s -> s.getTotalIncidents() != null ? s.getTotalIncidents() : 0L,
                        (current, ignore) -> current));

        Map<Integer, Long> nearMissByMonth = nonConformityRepository
                .findMonthlyNearMissByYear(refYear, companyId)
                .stream()
                .filter(m -> m.getMonth() != null)
                .collect(Collectors.toMap(MonthCount::getMonth,
                        m -> m.getTotal() != null ? m.getTotal() : 0L,
                        (current, ignore) -> current));

        return IntStream.rangeClosed(1, 12)
                .mapToObj(month -> new MonthlyPointDTO(month,
                        incidentsByMonth.getOrDefault(month, 0L),
                        nearMissByMonth.getOrDefault(month, 0L)))
                .toList();
    }

    // ──────────────────────────── Alertes ────────────────────────────

    /**
     * Alertes strictement calculées. Une alerte n'apparaît que si son décompte
     * réel est > 0. Aucune alerte n'est produite pour un domaine dont le modèle
     * de données ne permet pas le calcul — en particulier les « habilitations
     * expirées » : il n'existe aucune entité d'habilitation transverse dans HNS.
     */
    private List<DashboardAlertDTO> buildAlerts(Long companyId) throws HSException {
        List<DashboardAlertDTO> alerts = new ArrayList<>();

        long overdueActions = correctiveActionRepository.countOverdueActions(companyId, LocalDate.now(),
                CLOSED_ACTION_STATUSES);
        if (overdueActions > 0) {
            alerts.add(new DashboardAlertDTO("high",
                    "Actions correctives en retard",
                    String.valueOf(overdueActions),
                    "Échéance dépassée et statut non terminal."));
        }

        // On passe par le SERVICE et non par PpeRepository.findLowStock() : cette
        // requête n'est pas scopée par mine (fuite inter-entreprises) et utilise
        // un « < » strict, ce qui masque les EPI pile au seuil minimal.
        long lowStock = ppeService.getLowStock(companyId).size();
        if (lowStock > 0) {
            alerts.add(new DashboardAlertDTO("medium",
                    "EPI sous le seuil de stock",
                    String.valueOf(lowStock),
                    "Références actives dont le stock est au niveau du seuil minimal ou en dessous."));
        }

        return alerts;
    }

    // ─────────────────────── Répartitions optionnelles ───────────────────────

    /**
     * Répartition par mine — pertinente uniquement en vue consolidée. En vue
     * mono-mine on renvoie null (et non une liste à un élément) : le champ n'a
     * alors aucun sens et l'IHM doit masquer le graphique.
     */
    private List<LabelCountDTO> buildIncidentsByMine(Long companyId, int refYear) {
        if (companyId != null) {
            return null;
        }
        List<IdCount> rows = incidentRepository.findIncidentCountByCompany(refYear);
        return rows.stream()
                .map(row -> new LabelCountDTO(String.valueOf(row.getId()), row.getTotal()))
                .toList();
    }

    /**
     * Répartition des risques.
     *
     * <p>On NE duplique PAS la logique du module Risques : on réutilise
     * {@code RiskService.getOverview}, qui construit déjà matrice et
     * distributions (et bénéficie de son cache). On expose sa distribution
     * {@code byLevelKey} TELLE QUELLE.</p>
     *
     * <p>Le libellé est la clé brute de la matrice au format « PS » (ex. « 35 »
     * = probabilité 3, gravité 5), c'est-à-dire exactement le contenu du champ
     * {@code Risk.riskLevel}. Aucun regroupement en bandes (« critique »,
     * « élevé »…) n'est appliqué : les seuils de bandes n'existent nulle part
     * dans le modèle, les inventer ici produirait une classification arbitraire
     * présentée comme un fait. Les valeurs hors {@code ^[1-5][1-5]$} sont déjà
     * écartées par le module Risques.</p>
     */
    private List<LabelCountDTO> buildRiskByLevel(Long companyId) throws HSException {
        RiskOverviewResponse overview = riskService.getOverview(null, null, null, null, null, null, companyId);
        if (overview == null || overview.getDistributions() == null
                || overview.getDistributions().getByLevelKey() == null) {
            return null;
        }
        return overview.getDistributions().getByLevelKey().entrySet().stream()
                .map(e -> new LabelCountDTO(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(LabelCountDTO::getLabel))
                .toList();
    }

    // ──────────────────────────── Utilitaires ────────────────────────────

    /** Les libellés nuls (catégorie/gravité sans nom) sont exposés en "UNKNOWN". */
    private List<LabelCountDTO> toLabelCounts(List<LabelCount> rows) {
        return rows.stream()
                .map(row -> new LabelCountDTO(row.getLabel() != null ? row.getLabel() : "UNKNOWN",
                        row.getTotal() != null ? row.getTotal() : 0L))
                .toList();
    }
}
