package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.dotation.DotationCategoryStateDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationDetailDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationEmployeeDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationEquipmentDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationListDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationSummaryDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;
import com.minexpert.hns.repository.ppe.PpeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Suivi des dotations EPI — MOTEUR DE CONFORMITÉ (source unique côté serveur).
 *
 * Référentiel d'exigences (v1) : les CATÉGORIES d'EPI obligatoires actives de la mine
 * (ppe.mandatory = true). Une exigence de catégorie est SATISFAITE si l'employé possède
 * une attribution valide (non retournée, non expirée) d'un EPI de cette catégorie.
 * Extensible ultérieurement à une matrice poste/EPI sans changer le contrat d'API.
 *
 * Statuts : CRITIQUE (une exigence expirée) > A_COMPLETER (une exigence jamais servie)
 * > A_RENOUVELER (tout satisfait mais un renouvellement < 30 j) > CONFORME.
 */
@Service
@RequiredArgsConstructor
public class PpeDotationServiceImpl implements PpeDotationService {

    private static final int RENEWAL_WINDOW_DAYS = 30;
    // En-deçà de ce seuil, l'EPI est un CONSOMMABLE (bouchons, masques, gants jetables) :
    // réapprovisionné en continu, il n'est pas soumis à un suivi d'expiration/renouvellement
    // par personne — sa seule présence satisfait l'exigence. Au-delà, EPI DURABLE suivi.
    private static final int CONSUMABLE_MAX_LIFESPAN_MONTHS = 6;

    private static final Map<String, String> CATEGORY_LABELS = Map.ofEntries(
            Map.entry("Head protection", "Protection de la tête"),
            Map.entry("Eye protection", "Protection des yeux"),
            Map.entry("Hand protection", "Protection des mains"),
            Map.entry("Foot protection", "Protection des pieds"),
            Map.entry("Respiratory protection", "Protection respiratoire"),
            Map.entry("Protective clothing", "Vêtements de protection"),
            Map.entry("Hearing protection", "Protection auditive"),
            Map.entry("Fall protection", "Protection antichute"));

    private final PpeRepository ppeRepository;
    private final PpeEmpRepository empRepository;

    private static String label(String cat) {
        return cat == null ? "—" : CATEGORY_LABELS.getOrDefault(cat, cat);
    }

    // ── Modèles internes ─────────────────────────────────────────────────────
    private record Attrib(Long ppeId, String name, String category, String brand, String model,
            String size, Integer lifespanMonths, Double price, int issued, int returned,
            LocalDate date, LocalDate expiry, String state) {
    }

    private record Emp(Long id, String matricule, String name, String department, String position) {
    }

    /** Évaluation complète d'un employé (base des 3 endpoints). */
    private record Eval(Emp emp, int required, int satisfied, int pct, String status,
            List<DotationCategoryStateDTO> categories, List<Attrib> attribs,
            LocalDate lastDotation, LocalDate nextRenewal, Integer nextRenewalDays) {
    }

    private List<Eval> evaluateAll(Long companyId) throws HSException {
        if (companyId == null || companyId <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        LocalDate today = LocalDate.now();

        // Exigences = catégories obligatoires actives de la mine.
        List<String> requiredCats = ppeRepository.findByStatusAndCompany(PpeStatus.ACTIVE, companyId).stream()
                .filter(p -> Boolean.TRUE.equals(p.getMandatory()) && p.getCategory() != null)
                .map(Ppe::getCategory).distinct().toList();

        // Attributions par employé.
        Map<Long, List<Attrib>> byEmp = new LinkedHashMap<>();
        for (Object[] r : empRepository.attributionsByCompany(companyId)) {
            Long empId = ((Number) r[0]).longValue();
            LocalDate date = r[11] != null ? ((LocalDate) r[11]) : null;
            Integer life = r[7] != null ? ((Number) r[7]).intValue() : null;
            int issued = r[9] != null ? ((Number) r[9]).intValue() : 0;
            int returned = r[10] != null ? ((Number) r[10]).intValue() : 0;
            // Consommable (durée de vie courte) → pas d'expiration de conformité.
            LocalDate expiry = (life != null && life >= CONSUMABLE_MAX_LIFESPAN_MONTHS && date != null)
                    ? date.plusMonths(life) : null;
            String state;
            if (returned >= issued && issued > 0) {
                state = "RETOURNE";
            } else if (expiry != null && expiry.isBefore(today)) {
                state = "EXPIRE";
            } else if (expiry != null && !expiry.isAfter(today.plusDays(RENEWAL_WINDOW_DAYS))) {
                state = "A_RENOUVELER";
            } else {
                state = "BON";
            }
            byEmp.computeIfAbsent(empId, k -> new ArrayList<>()).add(new Attrib(
                    ((Number) r[1]).longValue(), (String) r[2], (String) r[3], (String) r[4], (String) r[5],
                    (String) r[6], life, r[8] != null ? ((Number) r[8]).doubleValue() : null,
                    issued, returned, date, expiry, state));
        }

        // Roster (HRMS).
        List<Emp> roster = empRepository.rosterByCompany(companyId).stream()
                .map(r -> new Emp(((Number) r[0]).longValue(),
                        r[1] != null ? r[1].toString() : ("EMP-" + r[0]),
                        r[2] != null && !r[2].toString().isBlank() ? r[2].toString() : ("Employé #" + r[0]),
                        r[3] != null ? r[3].toString() : "Sans département",
                        r[4] != null ? r[4].toString() : "—"))
                .toList();

        List<Eval> out = new ArrayList<>();
        for (Emp e : roster) {
            List<Attrib> as = byEmp.getOrDefault(e.id(), List.of());
            Map<String, List<Attrib>> byCat = as.stream()
                    .filter(a -> !"RETOURNE".equals(a.state()))
                    .collect(Collectors.groupingBy(a -> a.category() == null ? "—" : a.category()));

            int satisfied = 0;
            boolean hasExpired = false, hasMissing = false, hasDue = false;
            LocalDate nextRenewal = null;
            List<DotationCategoryStateDTO> cats = new ArrayList<>();
            for (String cat : requiredCats) {
                List<Attrib> list = byCat.getOrDefault(cat, List.of());
                String state;
                if (list.isEmpty()) {
                    state = "MISSING";
                    hasMissing = true;
                } else {
                    List<Attrib> valid = list.stream()
                            .filter(a -> a.expiry() == null || !a.expiry().isBefore(today)).toList();
                    if (valid.isEmpty()) {
                        state = "EXPIRED";
                        hasExpired = true;
                    } else {
                        satisfied++;
                        LocalDate bestExpiry = valid.stream().map(Attrib::expiry)
                                .filter(x -> x != null).max(Comparator.naturalOrder()).orElse(null);
                        if (bestExpiry != null && !bestExpiry.isAfter(today.plusDays(RENEWAL_WINDOW_DAYS))) {
                            state = "DUE";
                            hasDue = true;
                        } else {
                            state = "SATISFIED";
                        }
                        if (bestExpiry != null && (nextRenewal == null || bestExpiry.isBefore(nextRenewal))) {
                            nextRenewal = bestExpiry;
                        }
                    }
                }
                cats.add(DotationCategoryStateDTO.builder()
                        .category(cat).categoryLabel(label(cat)).state(state).mandatory(true).build());
            }

            int required = requiredCats.size();
            int pct = required == 0 ? 100 : (int) Math.round(100.0 * satisfied / required);
            String status = required == 0 ? "NON_EVALUE"
                    : hasExpired ? "CRITIQUE"
                            : hasMissing ? "A_COMPLETER"
                                    : hasDue ? "A_RENOUVELER" : "CONFORME";
            LocalDate lastDotation = as.stream().map(Attrib::date).filter(x -> x != null)
                    .max(Comparator.naturalOrder()).orElse(null);
            Integer nextDays = nextRenewal != null ? (int) ChronoUnit.DAYS.between(today, nextRenewal) : null;

            out.add(new Eval(e, required, satisfied, pct, status, cats, as, lastDotation, nextRenewal, nextDays));
        }
        return out;
    }

    private DotationEmployeeDTO toRow(Eval ev) {
        return DotationEmployeeDTO.builder()
                .empId(ev.emp().id()).matricule(ev.emp().matricule()).name(ev.emp().name())
                .department(ev.emp().department()).position(ev.emp().position())
                .compliancePct(ev.pct()).requiredCount(ev.required()).satisfiedCount(ev.satisfied())
                .categories(ev.categories())
                .nextRenewalDate(ev.nextRenewal()).nextRenewalDays(ev.nextRenewalDays())
                .lastDotationDate(ev.lastDotation()).status(ev.status()).build();
    }

    @Override
    public DotationSummaryDTO getSummary(Long companyId) throws HSException {
        List<Eval> all = evaluateAll(companyId);
        int total = all.size();
        int conf = 0, incomplete = 0, renew = 0, critical = 0, nonEval = 0;
        for (Eval e : all) {
            switch (e.status()) {
                case "CONFORME" -> conf++;
                case "A_COMPLETER" -> incomplete++;
                case "A_RENOUVELER" -> renew++;
                case "CRITIQUE" -> critical++;
                default -> nonEval++;
            }
        }
        List<DotationSummaryDTO.StatusCount> dist = new ArrayList<>();
        int t = total == 0 ? 1 : total;
        dist.add(sc("CONFORME", conf, t));
        dist.add(sc("A_RENOUVELER", renew, t));
        dist.add(sc("A_COMPLETER", incomplete, t));
        dist.add(sc("CRITIQUE", critical, t));
        if (nonEval > 0) dist.add(sc("NON_EVALUE", nonEval, t));
        return DotationSummaryDTO.builder()
                .totalEmployees(total).compliant(conf).incomplete(incomplete)
                .renewalDue(renew).critical(critical).distribution(dist).build();
    }

    private static DotationSummaryDTO.StatusCount sc(String s, int c, int t) {
        return DotationSummaryDTO.StatusCount.builder().status(s).count(c)
                .pct(Math.round(1000.0 * c / t) / 10.0).build();
    }

    @Override
    public DotationListDTO getEmployees(Long companyId, String search, String status, String department,
            String function, String sort, int page, int size) throws HSException {
        List<Eval> all = evaluateAll(companyId);

        // Options de filtres (avant filtrage).
        List<String> departments = all.stream().map(e -> e.emp().department())
                .filter(x -> x != null && !x.isBlank()).distinct().sorted().toList();
        List<String> functions = all.stream().map(e -> e.emp().position())
                .filter(x -> x != null && !x.isBlank() && !"—".equals(x)).distinct().sorted().toList();

        String q = search == null ? "" : search.trim().toLowerCase();
        List<Eval> filtered = all.stream()
                .filter(e -> status == null || status.isBlank() || status.equalsIgnoreCase(e.status()))
                .filter(e -> department == null || department.isBlank() || department.equalsIgnoreCase(e.emp().department()))
                .filter(e -> function == null || function.isBlank() || function.equalsIgnoreCase(e.emp().position()))
                .filter(e -> q.isEmpty() || matches(e, q))
                .collect(Collectors.toList());

        Comparator<Eval> cmp = comparator(sort);
        filtered.sort(cmp);

        int total = filtered.size();
        int p = Math.max(0, page);
        int s = size <= 0 ? 10 : size;
        int from = Math.min(p * s, total);
        int to = Math.min(from + s, total);
        List<DotationEmployeeDTO> content = filtered.subList(from, to).stream().map(this::toRow).toList();

        return DotationListDTO.builder().content(content).total(total).page(p).size(s)
                .departments(departments).functions(functions).build();
    }

    private static boolean matches(Eval e, String q) {
        if (e.emp().name().toLowerCase().contains(q)) return true;
        if (e.emp().matricule() != null && e.emp().matricule().toLowerCase().contains(q)) return true;
        if (e.emp().position() != null && e.emp().position().toLowerCase().contains(q)) return true;
        if (e.emp().department() != null && e.emp().department().toLowerCase().contains(q)) return true;
        return e.attribs().stream().anyMatch(a -> a.name() != null && a.name().toLowerCase().contains(q));
    }

    private static Comparator<Eval> comparator(String sort) {
        String key = sort == null ? "name" : sort.toLowerCase();
        boolean desc = key.endsWith(":desc");
        String field = key.replace(":desc", "").replace(":asc", "");
        Comparator<Eval> c = switch (field) {
            case "compliance", "compliancepct" -> Comparator.comparingInt(Eval::pct);
            case "department" -> Comparator.comparing(e -> e.emp().department(), Comparator.nullsLast(String::compareToIgnoreCase));
            case "position", "poste" -> Comparator.comparing(e -> e.emp().position(), Comparator.nullsLast(String::compareToIgnoreCase));
            case "status" -> Comparator.comparing(Eval::status);
            case "renewal" -> Comparator.comparing(e -> e.nextRenewal(), Comparator.nullsLast(Comparator.naturalOrder()));
            case "lastdotation" -> Comparator.comparing(e -> e.lastDotation(), Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(e -> e.emp().name(), Comparator.nullsLast(String::compareToIgnoreCase));
        };
        return desc ? c.reversed() : c;
    }

    @Override
    public DotationDetailDTO getEmployeeDetail(Long companyId, Long empId) throws HSException {
        Eval ev = evaluateAll(companyId).stream()
                .filter(e -> e.emp().id().equals(empId)).findFirst()
                .orElseThrow(() -> new HSException("EMPLOYEE_NOT_FOUND"));
        LocalDate today = LocalDate.now();

        List<DotationEquipmentDTO> attributed = ev.attribs().stream()
                .sorted(Comparator.comparing(Attrib::date, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(a -> DotationEquipmentDTO.builder()
                        .ppeId(a.ppeId()).name(a.name()).category(a.category()).categoryLabel(label(a.category()))
                        .brand(a.brand()).model(a.model()).size(a.size()).quantity(a.issued())
                        .lastDate(a.date()).expiryDate(a.expiry())
                        .renewalDays(a.expiry() != null ? (int) ChronoUnit.DAYS.between(today, a.expiry()) : null)
                        .state(a.state()).mandatory(false).build())
                .toList();

        List<DotationCategoryStateDTO> missing = ev.categories().stream()
                .filter(c -> "MISSING".equals(c.getState()) || "EXPIRED".equals(c.getState()))
                .toList();

        DotationDetailDTO.NextAction nextAction = null;
        if (ev.nextRenewal() != null || !missing.isEmpty()) {
            if (!missing.isEmpty()) {
                DotationCategoryStateDTO m = missing.get(0);
                nextAction = DotationDetailDTO.NextAction.builder()
                        .category(m.getCategory()).ppeName(m.getCategoryLabel())
                        .priority("EXPIRED".equals(m.getState()) ? "HAUTE" : "MOYENNE")
                        .reason("EXPIRED".equals(m.getState()) ? "EPI obligatoire expiré à remplacer" : "EPI obligatoire non attribué")
                        .build();
            } else {
                nextAction = DotationDetailDTO.NextAction.builder()
                        .dueDate(ev.nextRenewal()).days(ev.nextRenewalDays())
                        .priority(ev.nextRenewalDays() != null && ev.nextRenewalDays() <= 7 ? "HAUTE" : "MOYENNE")
                        .reason("Renouvellement à prévoir").build();
            }
        }

        return DotationDetailDTO.builder()
                .empId(ev.emp().id()).matricule(ev.emp().matricule()).name(ev.emp().name())
                .department(ev.emp().department()).position(ev.emp().position())
                .status(ev.status()).compliancePct(ev.pct()).requiredCount(ev.required()).satisfiedCount(ev.satisfied())
                .attributed(attributed).missing(missing).nextAction(nextAction).build();
    }
}
