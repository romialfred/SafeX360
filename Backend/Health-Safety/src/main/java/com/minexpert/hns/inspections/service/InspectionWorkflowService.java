package com.minexpert.hns.inspections.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionApproval;
import com.minexpert.hns.entity.inspections.InspectionCheckpoint;
import com.minexpert.hns.entity.inspections.InspectionFinding;
import com.minexpert.hns.entity.inspections.InspectionHistory;
import com.minexpert.hns.entity.inspections.InspectionTeamMember;
import com.minexpert.hns.entity.inspections.InspectionTemplate;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.enums.CheckpointResponseType;
import com.minexpert.hns.enums.FindingConformity;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.enums.InspectionTeamRole;
import com.minexpert.hns.inspections.dto.ApprovalDTO;
import com.minexpert.hns.inspections.dto.FindingDTO;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;
import com.minexpert.hns.inspections.dto.InspectionSummaryDTO;
import com.minexpert.hns.inspections.dto.InspectionTeamMemberDTO;
import com.minexpert.hns.inspections.dto.ScheduleInspectionDTO;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.repository.inspections.InspectionApprovalRepository;
import com.minexpert.hns.repository.inspections.InspectionCheckpointRepository;
import com.minexpert.hns.repository.inspections.InspectionFindingRepository;
import com.minexpert.hns.repository.inspections.InspectionHistoryRepository;
import com.minexpert.hns.repository.inspections.InspectionTeamMemberRepository;
import com.minexpert.hns.repository.inspections.InspectionTemplateRepository;

/**
 * Service orchestrateur du workflow d'inspection refondu (2026-06).
 *
 * <p><b>Cycle de vie d'une inspection :</b></p>
 * <pre>
 *   schedule()     → SCHEDULED  (planifiee, findings vides crees pour chaque checkpoint)
 *   start()        → IN_PROGRESS (inspecteur a commence sur le terrain)
 *   saveFindings() → IN_PROGRESS (saisie batch des constats, recalcul conformite auto)
 *   updateSummary()→ IN_PROGRESS (synthese redigee)
 *   submit()       → SUBMITTED  (soumis pour validation equipe)
 *   approve()      → SUBMITTED  (un approver dit oui, attente des autres)
 *                  → APPROVED   (tous ont approuve → archivage automatique)
 *                  → ARCHIVED   (rapport fige)
 *   reject()       → IN_PROGRESS (retour edition pour correction)
 * </pre>
 *
 * <p>Toutes les transitions sont tracees dans {@link InspectionHistory}.
 * La conformite des findings est recalculee automatiquement par le service
 * a partir du type de checkpoint et de la rawValue saisie.</p>
 */
@Service
public class InspectionWorkflowService {

    @Autowired
    private GeneralInspectionRepository inspectionRepository;
    @Autowired
    private InspectionTemplateRepository templateRepository;
    @Autowired
    private InspectionFindingRepository findingRepository;
    @Autowired
    private InspectionApprovalRepository approvalRepository;
    @Autowired
    private InspectionCheckpointRepository checkpointRepository;
    @Autowired
    private InspectionTeamMemberRepository teamMemberRepository;
    @Autowired(required = false)
    private InspectionHistoryRepository historyRepository;
    // Sert a DERIVER la mine de l'inspection depuis le lieu cible lorsque le
    // parametre companyId est absent (vue consolidee « Toutes les Mines »).
    @Autowired(required = false)
    private com.minexpert.hns.repository.parameters.LocationRepository locationRepository;

    // ─────────────────────────────────────────────────────────────
    //  Planification
    // ─────────────────────────────────────────────────────────────

    /**
     * Planifie une nouvelle inspection. Cree l'entite GeneralInspection en
     * statut SCHEDULED et un finding vide (NOT_APPLICABLE) pour chaque
     * checkpoint du template choisi. L'inspecteur les remplira sur le
     * terrain.
     */
    @Transactional
    public Long schedule(ScheduleInspectionDTO dto, Long userId, Long companyId) {
        InspectionTemplate tpl = templateRepository.findById(dto.getTemplateId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Template introuvable : " + dto.getTemplateId()));
        if (!Boolean.TRUE.equals(tpl.getActive())) {
            throw new IllegalStateException("Le template '" + tpl.getCode() + "' est inactif.");
        }
        // Cloisonnement : interdire de planifier avec un template d'une autre mine.
        if (companyId != null && tpl.getCompanyId() != null
                && !companyId.equals(tpl.getCompanyId())) {
            throw new IllegalArgumentException("Template introuvable : " + dto.getTemplateId());
        }

        GeneralInspection inspection = new GeneralInspection();
        // Site (lieu) OPTIONNEL : dérivé de la cible côté client. On ne rattache
        // une Location que si un id valide est fourni — sinon on laisse null
        // (colonne relâchée). L'activité legacy reste null (workflow template).
        if (dto.getSiteId() != null) {
            Location site = new Location();
            site.setId(dto.getSiteId());
            inspection.setSite(site);
        }
        inspection.setPlannedDate(dto.getPlannedDate());
        inspection.setStartTime(dto.getStartTime());
        inspection.setEndTime(dto.getEndTime());
        inspection.setDescription(dto.getDescription());
        inspection.setObjectives(dto.getObjectives());
        inspection.setStatus(InspectionStatus.SCHEDULED);
        inspection.setTemplate(tpl);
        inspection.setTargetRefId(dto.getTargetRefId());
        inspection.setTargetLabel(dto.getTargetLabel());
        inspection.setPrimaryInspectorId(dto.getPrimaryInspectorId());
        // Mine de l'inspection : le parametre companyId prime (mine active du
        // header). En vue consolidee « Toutes les Mines » il est absent : on
        // DERIVE alors la mine du LIEU cible (source de verite), puis, en dernier
        // recours, de la mine du template. Sans cela l'inspection serait orpheline
        // (company_id NULL) et invisible hors vue consolidee.
        inspection.setCompanyId(resolveEffectiveCompany(companyId, dto.getSiteId(), tpl));
        inspection.setCreatedAt(LocalDateTime.now());
        inspection.setUpdatedAt(LocalDateTime.now());
        // Note : la colonne activity_id est NOT NULL en BDD pour rétro-compat.
        // En cas d'activité absente côté nouveau workflow, on saute la
        // validation : c'est le service appelant qui doit fournir un id
        // d'activité valide. Pour simplifier la refonte, le frontend sera
        // responsable de pré-creer un Activity ou on assouplira plus tard.
        // [TODO Phase 2.b : assouplir le NOT NULL ou créer auto une activité]

        // L'equipe est normalisee AVANT la sauvegarde : la resolution du LEAD
        // alimente primaryInspectorId, qui doit etre persiste avec l'inspection.
        List<InspectionTeamMemberDTO> team = normalizeTeam(
                dto.getTeamMembers(), dto.getPrimaryInspectorId());
        if (!team.isEmpty()) {
            // Par construction, team.get(0) est le LEAD (cf. normalizeTeam).
            inspection.setPrimaryInspectorId(team.get(0).getEmployeeId());
        }

        GeneralInspection saved = inspectionRepository.save(inspection);

        // Les membres sont persistes APRES la sauvegarde : la FK inspection_id
        // est NOT NULL, il faut donc l'id genere.
        for (InspectionTeamMemberDTO m : team) {
            InspectionTeamMember member = new InspectionTeamMember();
            member.setInspection(saved);
            member.setEmployeeId(m.getEmployeeId());
            member.setRole(m.getRole());
            // Cloisonnement : le membre herite de la mine de l'inspection.
            member.setCompanyId(saved.getCompanyId());
            teamMemberRepository.save(member);
        }

        // Cree un finding vide pour chaque checkpoint
        for (InspectionCheckpoint cp : tpl.getCheckpoints()) {
            InspectionFinding f = new InspectionFinding();
            f.setInspection(saved);
            f.setCheckpoint(cp);
            f.setConformity(FindingConformity.NOT_APPLICABLE);
            f.setRecordedAt(LocalDateTime.now());
            f.setCompanyId(saved.getCompanyId());
            findingRepository.save(f);
        }

        logHistory(saved, null, InspectionStatus.SCHEDULED, userId,
                "Inspection planifiee avec template " + tpl.getCode());
        return saved.getId();
    }

    /**
     * Determine la mine effective de l'inspection :
     * <ol>
     *   <li>le parametre {@code companyId} s'il est positif (mine active du
     *       header, hors vue consolidee) ;</li>
     *   <li>sinon la mine du LIEU cible ({@code siteId}) — source de verite ;</li>
     *   <li>sinon la mine du template.</li>
     * </ol>
     * Renvoie {@code null} si aucune mine ne peut etre determinee (cible et
     * template eux-memes non rattaches) : l'inspection reste alors visible en vue
     * consolidee sans casser la planification.
     */
    private Long resolveEffectiveCompany(Long companyId, Long siteId, InspectionTemplate tpl) {
        if (companyId != null && companyId > 0) {
            return companyId;
        }
        if (siteId != null && locationRepository != null) {
            Long fromSite = locationRepository.findById(siteId)
                    .map(loc -> loc.getCompanyId())
                    .filter(c -> c != null && c > 0)
                    .orElse(null);
            if (fromSite != null) {
                return fromSite;
            }
        }
        Long fromTemplate = tpl.getCompanyId();
        return (fromTemplate != null && fromTemplate > 0) ? fromTemplate : null;
    }

    // ─────────────────────────────────────────────────────────────
    //  Execution terrain
    // ─────────────────────────────────────────────────────────────

    /** Marque l'inspection comme demarree (passage IN_PROGRESS). */
    @Transactional
    public void start(Long inspectionId, Long userId, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        assertStatusIn(insp, "demarrer", InspectionStatus.SCHEDULED);
        assertNotBeforePlannedDate(insp);
        InspectionStatus from = insp.getStatus();
        insp.setStatus(InspectionStatus.IN_PROGRESS);
        insp.setUpdatedAt(LocalDateTime.now());
        if (insp.getPrimaryInspectorId() == null) {
            insp.setPrimaryInspectorId(userId);
        }
        inspectionRepository.save(insp);
        logHistory(insp, from, InspectionStatus.IN_PROGRESS, userId,
                "Inspection demarree sur le terrain");
    }

    /**
     * Saisie batch des findings (mobile/tablette). Les findings sont
     * identifies soit par id (update) soit par checkpointId (upsert).
     * La conformite est recalculee automatiquement si non surchargee.
     */
    @Transactional
    public void saveFindings(Long inspectionId, List<FindingDTO> dtos, Long userId, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        assertStatusIn(insp, "saisir des findings",
                InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS);
        // Meme verrou que start() : cette methode fait sa PROPRE transition
        // SCHEDULED -> IN_PROGRESS (voir plus bas). Sans ce controle, un POST
        // direct sur /findings/batch demarrait une inspection future et
        // enregistrait des constats ANTIDATES en contournant start() —
        // exactement le trou que la regle vise a fermer. Une porte derobee
        // annule la regle : elle doit etre gardee partout ou la transition a
        // lieu, pas seulement sur le chemin nominal.
        if (insp.getStatus() == InspectionStatus.SCHEDULED) {
            assertNotBeforePlannedDate(insp);
        }
        // Passe en IN_PROGRESS si c'etait SCHEDULED
        if (insp.getStatus() == InspectionStatus.SCHEDULED) {
            insp.setStatus(InspectionStatus.IN_PROGRESS);
            logHistory(insp, InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS, userId,
                    "Saisie des constats commencee");
        }

        List<InspectionFinding> existing = findingRepository
                .findByInspectionIdOrderByCheckpointDisplayOrderAsc(inspectionId);

        for (FindingDTO dto : dtos) {
            InspectionFinding f = locateFinding(existing, dto);
            if (f == null) {
                // Creation a la volee (cas ou la planification n'a pas pre-cree)
                InspectionCheckpoint cp = checkpointRepository.findById(dto.getCheckpointId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Checkpoint introuvable : " + dto.getCheckpointId()));
                f = new InspectionFinding();
                f.setInspection(insp);
                f.setCheckpoint(cp);
                f.setCompanyId(insp.getCompanyId());
            }
            f.setRawValue(dto.getRawValue());
            f.setNote(dto.getNote());
            f.setPhotoIds(dto.getPhotoIds());
            f.setRecordedBy(userId);
            f.setRecordedAt(LocalDateTime.now());
            if (dto.getConformity() != null) {
                f.setConformity(dto.getConformity());
                f.setOverrideReason(dto.getOverrideReason());
            } else {
                f.setConformity(autoEvaluateConformity(f.getCheckpoint(), dto.getRawValue()));
                f.setOverrideReason(null);
            }
            findingRepository.save(f);
        }

        insp.setUpdatedAt(LocalDateTime.now());
        inspectionRepository.save(insp);
    }

    /** Met a jour la synthese texte du rapport. Possible jusqu'a APPROVED. */
    @Transactional
    public void updateSummary(Long inspectionId, String summary, Long userId, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        if (insp.getStatus() == InspectionStatus.APPROVED
                || insp.getStatus() == InspectionStatus.ARCHIVED) {
            throw new IllegalStateException(
                    "La synthese n'est plus modifiable apres approbation/archivage.");
        }
        insp.setSummaryReport(summary);
        insp.setUpdatedAt(LocalDateTime.now());
        inspectionRepository.save(insp);
    }

    /**
     * Remplace l'équipe d'une inspection DÉJÀ PLANIFIÉE (employés + rôles).
     *
     * <p>Jusqu'ici l'équipe n'était figée qu'à la planification : une erreur de
     * composition (mauvais inspecteur, absence de dernière minute, changement de
     * chef) imposait d'annuler et de replanifier. Cet endpoint comble ce trou.</p>
     *
     * <p><b>Sémantique de remplacement intégral</b> (et non de fusion) : la liste
     * reçue devient l'équipe. C'est ce que fait l'IHM, qui envoie l'état complet
     * du tableau ; une fusion rendrait le retrait d'un membre impossible.</p>
     *
     * <p>Les invariants (exactement un LEAD, pas de doublon d'employé, rôle
     * valide) sont délégués à {@link #normalizeTeam} : ils restent portés à UN
     * SEUL endroit, partagé avec {@code schedule()}. {@code primaryInspectorId}
     * est re-dérivé du LEAD pour rester cohérent ({@code start()} et le PDF le
     * lisent).</p>
     *
     * <p>Verrouillage : interdit après APPROVED/ARCHIVED — le rapport est figé,
     * réécrire son équipe falsifierait une preuve d'audit (même règle que
     * {@link #updateSummary}).</p>
     *
     * @param members liste complète ; vide/null vide l'équipe (et remet
     *                {@code primaryInspectorId} à null)
     */
    @Transactional
    public void updateTeam(Long inspectionId, List<InspectionTeamMemberDTO> members,
                           Long userId, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        if (insp.getStatus() == InspectionStatus.APPROVED
                || insp.getStatus() == InspectionStatus.ARCHIVED) {
            throw new IllegalStateException(
                    "L'equipe n'est plus modifiable apres approbation/archivage.");
        }

        // Normalisation AVANT toute écriture : si la composition est invalide,
        // on sort sans avoir supprimé l'équipe existante.
        List<InspectionTeamMemberDTO> team = normalizeTeam(members, null);

        teamMemberRepository.deleteByInspection_Id(inspectionId);
        // flush : le delete doit précéder les insert, sinon l'ordre de vidage du
        // contexte de persistance pourrait rejouer les suppressions après.
        teamMemberRepository.flush();

        for (InspectionTeamMemberDTO m : team) {
            InspectionTeamMember member = new InspectionTeamMember();
            member.setInspection(insp);
            member.setEmployeeId(m.getEmployeeId());
            member.setRole(m.getRole());
            member.setCompanyId(insp.getCompanyId()); // cloisonnement hérité
            teamMemberRepository.save(member);
        }

        // Le LEAD (toujours en tête après normalizeTeam) redevient l'inspecteur
        // principal ; équipe vide => plus d'inspecteur principal.
        insp.setPrimaryInspectorId(team.isEmpty() ? null : team.get(0).getEmployeeId());
        insp.setUpdatedAt(LocalDateTime.now());
        inspectionRepository.save(insp);

        logHistory(insp, insp.getStatus(), insp.getStatus(), userId,
                "Equipe d'inspection mise a jour (" + team.size() + " membre(s))");
    }

    // ─────────────────────────────────────────────────────────────
    //  Soumission et validation
    // ─────────────────────────────────────────────────────────────

    /**
     * Soumet l'inspection pour validation equipe. Verifie au passage que
     * tous les findings requis ont une reponse.
     */
    @Transactional
    public void submit(Long inspectionId, Long userId, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        assertStatusIn(insp, "soumettre",
                InspectionStatus.IN_PROGRESS, InspectionStatus.REJECTED);
        // Verification : tous les checkpoints required doivent avoir un finding rempli
        List<InspectionFinding> findings = findingRepository
                .findByInspectionIdOrderByCheckpointDisplayOrderAsc(inspectionId);
        List<String> missing = new ArrayList<>();
        for (InspectionFinding f : findings) {
            if (Boolean.TRUE.equals(f.getCheckpoint().getRequired())
                    && (f.getRawValue() == null || f.getRawValue().isBlank())) {
                missing.add(f.getCheckpoint().getLabel());
            }
        }
        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "Impossible de soumettre : points de controle obligatoires non renseignes : "
                            + String.join(", ", missing));
        }

        InspectionStatus from = insp.getStatus();
        insp.setStatus(InspectionStatus.SUBMITTED);
        insp.setSubmittedAt(LocalDateTime.now());
        insp.setUpdatedAt(LocalDateTime.now());
        inspectionRepository.save(insp);
        // Reset des approbations precedentes (cas re-soumission apres rejet)
        approvalRepository.deleteByInspectionId(inspectionId);
        logHistory(insp, from, InspectionStatus.SUBMITTED, userId,
                "Inspection soumise pour validation equipe");
    }

    /**
     * Enregistre la decision d'un membre de l'equipe. Si APPROVE et tous les
     * autres ont deja approuve : l'inspection passe APPROVED puis ARCHIVED.
     * Si REJECT : l'inspection retourne IN_PROGRESS et les approbations sont
     * effacees pour repartir sur un nouveau cycle.
     */
    @Transactional
    public void decide(Long inspectionId, ApprovalDTO dto, Long userId, int expectedApproverCount, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        assertStatusIn(insp, "valider", InspectionStatus.SUBMITTED);

        String decision = dto.getDecision() != null ? dto.getDecision().toUpperCase() : null;
        if (!"APPROVE".equals(decision) && !"REJECT".equals(decision)) {
            throw new IllegalArgumentException("Decision invalide : doit etre APPROVE ou REJECT.");
        }
        if ("REJECT".equals(decision)
                && (dto.getComment() == null || dto.getComment().isBlank())) {
            throw new IllegalArgumentException("Un commentaire est obligatoire en cas de rejet.");
        }

        Long approverId = dto.getApproverId() != null ? dto.getApproverId() : userId;
        // Cas REJECT : retour IN_PROGRESS, reset approbations
        if ("REJECT".equals(decision)) {
            // Enregistre tout de meme la decision avant reset, en historique
            logHistory(insp, InspectionStatus.SUBMITTED, InspectionStatus.IN_PROGRESS, userId,
                    "Rejet par " + approverId + " : " + dto.getComment());
            approvalRepository.deleteByInspectionId(inspectionId);
            insp.setStatus(InspectionStatus.IN_PROGRESS);
            insp.setSubmittedAt(null);
            insp.setUpdatedAt(LocalDateTime.now());
            inspectionRepository.save(insp);
            return;
        }

        // Cas APPROVE : upsert de la decision du membre
        Optional<InspectionApproval> existing = approvalRepository
                .findByInspectionIdAndApproverId(inspectionId, approverId);
        InspectionApproval approval = existing.orElseGet(InspectionApproval::new);
        approval.setInspection(insp);
        approval.setApproverId(approverId);
        approval.setDecision("APPROVE");
        approval.setComment(dto.getComment());
        approval.setDecidedAt(LocalDateTime.now());
        approval.setCompanyId(insp.getCompanyId());
        approvalRepository.save(approval);

        long approveCount = approvalRepository.countByInspectionIdAndDecision(inspectionId, "APPROVE");
        // Si tous ont approuve → APPROVED puis ARCHIVED
        if (approveCount >= expectedApproverCount) {
            insp.setStatus(InspectionStatus.APPROVED);
            insp.setApprovedAt(LocalDateTime.now());
            insp.setArchivedAt(LocalDateTime.now());
            insp.setUpdatedAt(LocalDateTime.now());
            inspectionRepository.save(insp);
            logHistory(insp, InspectionStatus.SUBMITTED, InspectionStatus.APPROVED, userId,
                    "Inspection approuvee par toute l'equipe (" + approveCount + "/"
                            + expectedApproverCount + ") - archivage automatique");
            // Passe finale en ARCHIVED
            insp.setStatus(InspectionStatus.ARCHIVED);
            inspectionRepository.save(insp);
            logHistory(insp, InspectionStatus.APPROVED, InspectionStatus.ARCHIVED, userId,
                    "Rapport fige et archive");
        } else {
            logHistory(insp, InspectionStatus.SUBMITTED, InspectionStatus.SUBMITTED, userId,
                    "Approbation " + approveCount + "/" + expectedApproverCount + " par " + approverId);
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Lecture
    // ─────────────────────────────────────────────────────────────

    /** Detail complet d'une inspection (template + findings + approvals + KPI). */
    @Transactional(readOnly = true)
    public InspectionDetailDTO getDetail(Long inspectionId, Long companyId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertCompany(insp, companyId);
        return toDetailDTO(insp);
    }

    /**
     * Surcharge « appel système » (companyId=null → pas de filtre par mine).
     * Utilisée par les services internes (analyse IA, génération PDF) où
     * l'appartenance a déjà été vérifiée en amont par le controller.
     */
    @Transactional(readOnly = true)
    public InspectionDetailDTO getDetail(Long inspectionId) {
        return getDetail(inspectionId, null);
    }

    /**
     * Vérifie qu'une inspection est accessible pour la mine (téléchargement PDF).
     * Lève une exception si elle appartient à une autre mine.
     */
    @Transactional(readOnly = true)
    public void assertAccessible(Long inspectionId, Long companyId) {
        assertCompany(loadOrThrow(inspectionId), companyId);
    }

    /** Registre des inspections de la mine (companyId null = toutes mines). */
    @Transactional(readOnly = true)
    public List<InspectionSummaryDTO> listAll(Long companyId) {
        List<GeneralInspection> all = new ArrayList<>(
                inspectionRepository.findAllByCompany(companyId));
        all.sort(Comparator.comparing(GeneralInspection::getPlannedDate,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return all.stream().map(this::toSummaryDTO).toList();
    }

    // ─────────────────────────────────────────────────────────────
    //  Helpers internes
    // ─────────────────────────────────────────────────────────────

    /**
     * Normalise l'equipe fournie a la planification et applique les invariants
     * metier. Le resultat est pret a persister : roles canoniques (String), le
     * LEAD en premiere position, aucun doublon.
     *
     * <p>Regles :</p>
     * <ol>
     *   <li>Membres sans {@code employeeId} ignores (lignes vides de l'IHM).</li>
     *   <li>Role absent → {@code INSPECTOR} par defaut ; role inconnu → erreur.</li>
     *   <li>Doublon d'{@code employeeId} → erreur (un seul role par personne).</li>
     *   <li><b>Exactement un LEAD</b> : plusieurs → erreur ; aucun mais
     *       {@code primaryInspectorId} fourni → LEAD cree depuis lui (s'il est
     *       deja dans l'equipe avec un autre role, ce role est promu en LEAD
     *       plutot que de creer un doublon).</li>
     *   <li>Liste vide/null sans {@code primaryInspectorId} → liste vide :
     *       le comportement historique (aucune equipe) reste valide.</li>
     * </ol>
     *
     * @return liste normalisee, LEAD en tete ; vide si aucune equipe exploitable
     */
    private List<InspectionTeamMemberDTO> normalizeTeam(List<InspectionTeamMemberDTO> raw,
                                                        Long primaryInspectorId) {
        List<InspectionTeamMemberDTO> out = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        InspectionTeamMemberDTO lead = null;

        if (raw != null) {
            for (InspectionTeamMemberDTO in : raw) {
                if (in == null || in.getEmployeeId() == null) {
                    continue; // ligne vide laissee par l'IHM : on ignore
                }
                if (!seen.add(in.getEmployeeId())) {
                    throw new IllegalArgumentException(
                            "Equipe d'inspection invalide : l'employe " + in.getEmployeeId()
                                    + " est present deux fois. Un membre ne peut tenir qu'un seul role.");
                }
                InspectionTeamRole role = InspectionTeamRole.parse(in.getRole());
                if (role == null) {
                    role = InspectionTeamRole.INSPECTOR; // defaut raisonnable
                }
                InspectionTeamMemberDTO m = new InspectionTeamMemberDTO();
                m.setEmployeeId(in.getEmployeeId());
                m.setRole(role.name());
                if (role == InspectionTeamRole.LEAD) {
                    if (lead != null) {
                        throw new IllegalArgumentException(
                                "Equipe d'inspection invalide : plusieurs inspecteurs principaux (LEAD)."
                                        + " Exactement un membre doit porter le role LEAD.");
                    }
                    lead = m;
                } else {
                    out.add(m);
                }
            }
        }

        if (lead == null) {
            if (primaryInspectorId == null) {
                if (!out.isEmpty()) {
                    throw new IllegalArgumentException(
                            "Equipe d'inspection invalide : aucun inspecteur principal (LEAD)."
                                    + " Designez un membre LEAD ou renseignez l'inspecteur principal.");
                }
                return out; // ni equipe ni inspecteur : rien a persister
            }
            // Un LEAD est deduit de primaryInspectorId. S'il figure deja dans
            // l'equipe avec un autre role, on le promeut au lieu de le doublonner.
            InspectionTeamMemberDTO already = out.stream()
                    .filter(m -> primaryInspectorId.equals(m.getEmployeeId()))
                    .findFirst().orElse(null);
            if (already != null) {
                out.remove(already);
                already.setRole(InspectionTeamRole.LEAD.name());
                lead = already;
            } else {
                lead = new InspectionTeamMemberDTO();
                lead.setEmployeeId(primaryInspectorId);
                lead.setRole(InspectionTeamRole.LEAD.name());
            }
        }

        out.add(0, lead); // LEAD en tete : schedule() y lit primaryInspectorId
        return out;
    }

    private GeneralInspection loadOrThrow(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inspection introuvable : " + id));
    }

    /**
     * Cloisonnement : refuse l'accès à une inspection d'une autre mine.
     * companyId null (appel système / allMines) ne contrôle pas. Message
     * volontairement identique à "introuvable" pour ne pas divulguer.
     */
    private void assertCompany(GeneralInspection insp, Long companyId) {
        if (companyId != null && !companyId.equals(insp.getCompanyId())) {
            throw new IllegalArgumentException("Inspection introuvable : " + insp.getId());
        }
    }

    /**
     * Verrou de planification (ISO 45001 §9.1 — surveillance et mesure) : une
     * inspection ne démarre PAS avant sa date prévue.
     *
     * <p><b>Pourquoi c'est une règle métier et non une coquetterie d'IHM :</b>
     * démarrer en avance produirait un constat daté d'un jour où rien n'a été
     * observé sur le terrain. L'enregistrement perdrait sa valeur probante —
     * exactement ce que l'auditeur cherche à détecter (« pencil-whipping »).
     * La règle vit donc côté SERVEUR : une garde qui n'existe que dans l'IHM se
     * contourne par un appel direct à l'API.</p>
     *
     * <p><b>Ce qui reste permis, volontairement :</b></p>
     * <ul>
     *   <li>démarrer LE JOUR prévu (comparaison sur la date, pas l'heure) ;</li>
     *   <li>démarrer EN RETARD — jamais bloqué : un retard doit être rattrapable,
     *       et il est déjà visible comme écart de conformité ;</li>
     *   <li>avancer légitimement une inspection → on REPLANIFIE (acte tracé dans
     *       l'historique) plutôt que de contourner silencieusement la date.</li>
     * </ul>
     *
     * <p>Date nulle (donnée legacy) : pas de blocage.</p>
     */
    private void assertNotBeforePlannedDate(GeneralInspection insp) {
        java.time.LocalDate planned = insp.getPlannedDate();
        if (planned != null && planned.isAfter(java.time.LocalDate.now())) {
            throw new IllegalStateException(
                    "Inspection planifiee le "
                            + planned.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                            + " : elle ne peut pas demarrer avant cette date. "
                            + "Replanifiez-la si l'execution doit etre avancee.");
        }
    }

    private void assertStatusIn(GeneralInspection insp, String action, InspectionStatus... allowed) {
        Set<InspectionStatus> ok = new HashSet<>(List.of(allowed));
        if (!ok.contains(insp.getStatus())) {
            throw new IllegalStateException("Impossible de " + action
                    + " : statut courant " + insp.getStatus() + " (attendu : " + ok + ")");
        }
    }

    /**
     * Cherche un finding existant correspondant au DTO (par id en priorite,
     * sinon par checkpointId). Retourne null si non trouve.
     */
    private InspectionFinding locateFinding(List<InspectionFinding> existing, FindingDTO dto) {
        if (dto.getId() != null) {
            return existing.stream().filter(f -> f.getId().equals(dto.getId())).findFirst().orElse(null);
        }
        if (dto.getCheckpointId() != null) {
            return existing.stream()
                    .filter(f -> f.getCheckpoint() != null
                            && dto.getCheckpointId().equals(f.getCheckpoint().getId()))
                    .findFirst().orElse(null);
        }
        return null;
    }

    /**
     * Calcule la conformite automatique en fonction du type de checkpoint et
     * de la rawValue. La logique est volontairement permissive : en cas de
     * doute (valeur vide, format inattendu) on retourne NOT_APPLICABLE pour
     * laisser l'inspecteur surchager manuellement.
     */
    private FindingConformity autoEvaluateConformity(InspectionCheckpoint cp, String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return FindingConformity.NOT_APPLICABLE;
        }
        CheckpointResponseType rt = cp.getResponseType();
        if (rt == CheckpointResponseType.BOOLEAN) {
            boolean got = rawValue.equalsIgnoreCase("true");
            String expected = cp.getExpectedValue();
            boolean expectedBool = expected == null || expected.equalsIgnoreCase("true");
            return got == expectedBool ? FindingConformity.CONFORM : FindingConformity.NON_CONFORM;
        }
        if (rt == CheckpointResponseType.VISUAL_GRADE) {
            switch (rawValue.toUpperCase()) {
                case "GOOD":  return FindingConformity.CONFORM;
                case "WATCH": return FindingConformity.WATCH;
                case "POOR":  return FindingConformity.NON_CONFORM;
                default:      return FindingConformity.NOT_APPLICABLE;
            }
        }
        if (rt == CheckpointResponseType.NUMERIC_RANGE) {
            try {
                double v = Double.parseDouble(rawValue.trim());
                if (cp.getMinValue() != null && v < cp.getMinValue()) return FindingConformity.NON_CONFORM;
                if (cp.getMaxValue() != null && v > cp.getMaxValue()) return FindingConformity.NON_CONFORM;
                // Tolerance 10% pres des bornes → WATCH
                if (cp.getMinValue() != null && cp.getMaxValue() != null) {
                    double range = cp.getMaxValue() - cp.getMinValue();
                    double margin = range * 0.10;
                    if (v < cp.getMinValue() + margin || v > cp.getMaxValue() - margin) {
                        return FindingConformity.WATCH;
                    }
                }
                return FindingConformity.CONFORM;
            } catch (NumberFormatException e) {
                return FindingConformity.NOT_APPLICABLE;
            }
        }
        // PHOTO_REQUIRED / FREE_TEXT : pas de calcul auto, conform par defaut si reponse fournie
        return FindingConformity.CONFORM;
    }

    private void logHistory(GeneralInspection insp, InspectionStatus from,
                            InspectionStatus to, Long userId, String comment) {
        if (historyRepository == null) return; // tolerance si bean non present
        InspectionHistory h = new InspectionHistory();
        h.setOwnerId(userId);
        h.setDate(java.time.LocalDate.now());
        h.setStatus(to);
        h.setComment(comment);
        h.setInspection(insp);
        h.setCreatedAt(LocalDateTime.now());
        h.setCompanyId(insp.getCompanyId());
        historyRepository.save(h);
    }

    private InspectionDetailDTO toDetailDTO(GeneralInspection insp) {
        InspectionDetailDTO d = new InspectionDetailDTO();
        d.setId(insp.getId());
        if (insp.getActivity() != null) {
            d.setActivityId(insp.getActivity().getId());
            d.setActivityTitle(insp.getActivity().getTitle());
        }
        if (insp.getSite() != null) {
            d.setSiteId(insp.getSite().getId());
            d.setSiteName(insp.getSite().getName());
        }
        d.setPlannedDate(insp.getPlannedDate());
        d.setStartTime(insp.getStartTime());
        d.setEndTime(insp.getEndTime());
        d.setDescription(insp.getDescription());
        d.setObjectives(insp.getObjectives());
        d.setStatus(insp.getStatus());
        d.setCreatedAt(insp.getCreatedAt());
        d.setUpdatedAt(insp.getUpdatedAt());
        InspectionTemplate tpl = insp.getTemplate();
        if (tpl != null) {
            d.setTemplateId(tpl.getId());
            d.setTemplateCode(tpl.getCode());
            d.setTemplateName(tpl.getName());
            d.setTemplateType(tpl.getType());
        }
        d.setTargetRefId(insp.getTargetRefId());
        d.setTargetLabel(insp.getTargetLabel());
        d.setSubmittedAt(insp.getSubmittedAt());
        d.setApprovedAt(insp.getApprovedAt());
        d.setArchivedAt(insp.getArchivedAt());
        d.setPrimaryInspectorId(insp.getPrimaryInspectorId());
        d.setSummaryReport(insp.getSummaryReport());

        // Findings
        List<InspectionFinding> findings = findingRepository
                .findByInspectionIdOrderByCheckpointDisplayOrderAsc(insp.getId());
        int recorded = 0, nonConform = 0, watch = 0, critical = 0;
        for (InspectionFinding f : findings) {
            FindingDTO fd = toFindingDTO(f);
            d.getFindings().add(fd);
            if (f.getRawValue() != null && !f.getRawValue().isBlank()) recorded++;
            if (f.getConformity() == FindingConformity.NON_CONFORM) {
                nonConform++;
                if (Boolean.TRUE.equals(f.getCheckpoint().getCritical())) critical++;
            }
            if (f.getConformity() == FindingConformity.WATCH) watch++;
        }
        d.setTotalCheckpoints(findings.size());
        d.setFindingsRecorded(recorded);
        d.setNonConformCount(nonConform);
        d.setWatchCount(watch);
        d.setCriticalNonConformCount(critical);

        // Approvals
        List<InspectionApproval> approvals = approvalRepository
                .findByInspectionIdOrderByDecidedAtAsc(insp.getId());
        for (InspectionApproval a : approvals) {
            ApprovalDTO ad = new ApprovalDTO();
            ad.setId(a.getId());
            ad.setApproverId(a.getApproverId());
            ad.setDecision(a.getDecision());
            ad.setComment(a.getComment());
            ad.setDecidedAt(a.getDecidedAt());
            d.getApprovals().add(ad);
        }

        // Equipe (employe + role). Vide pour les inspections d'avant la refonte.
        List<InspectionTeamMember> team = teamMemberRepository
                .findByInspection_IdOrderByIdAsc(insp.getId());
        for (InspectionTeamMember m : team) {
            InspectionTeamMemberDTO md = new InspectionTeamMemberDTO();
            md.setId(m.getId());
            md.setEmployeeId(m.getEmployeeId());
            md.setRole(m.getRole());
            d.getTeamMembers().add(md);
        }
        return d;
    }

    private FindingDTO toFindingDTO(InspectionFinding f) {
        FindingDTO d = new FindingDTO();
        d.setId(f.getId());
        if (f.getCheckpoint() != null) {
            d.setCheckpointId(f.getCheckpoint().getId());
            d.setCheckpointLabel(f.getCheckpoint().getLabel());
            d.setResponseType(f.getCheckpoint().getResponseType() != null
                    ? f.getCheckpoint().getResponseType().name() : null);
            d.setMinValue(f.getCheckpoint().getMinValue());
            d.setMaxValue(f.getCheckpoint().getMaxValue());
            d.setUnit(f.getCheckpoint().getUnit());
            d.setCritical(f.getCheckpoint().getCritical());
            d.setHelpText(f.getCheckpoint().getHelpText());
            d.setDisplayOrder(f.getCheckpoint().getDisplayOrder());
        }
        d.setRawValue(f.getRawValue());
        d.setConformity(f.getConformity());
        d.setNote(f.getNote());
        d.setPhotoIds(f.getPhotoIds());
        d.setRecordedBy(f.getRecordedBy());
        d.setRecordedAt(f.getRecordedAt());
        d.setOverrideReason(f.getOverrideReason());
        return d;
    }

    private InspectionSummaryDTO toSummaryDTO(GeneralInspection insp) {
        InspectionSummaryDTO s = new InspectionSummaryDTO();
        s.setId(insp.getId());
        s.setPlannedDate(insp.getPlannedDate());
        s.setStartTime(insp.getStartTime());
        s.setStatus(insp.getStatus());
        InspectionTemplate tpl = insp.getTemplate();
        if (tpl != null) {
            s.setTemplateCode(tpl.getCode());
            s.setTemplateName(tpl.getName());
            s.setTemplateType(tpl.getType());
        }
        s.setTargetLabel(insp.getTargetLabel());
        if (insp.getSite() != null) {
            s.setSiteName(insp.getSite().getName());
        }
        s.setPrimaryInspectorId(insp.getPrimaryInspectorId());
        s.setSubmittedAt(insp.getSubmittedAt());
        s.setArchivedAt(insp.getArchivedAt());
        // KPI rapides : compteurs depuis findings
        long total = findingRepository
                .findByInspectionIdOrderByCheckpointDisplayOrderAsc(insp.getId()).size();
        s.setTotalCheckpoints((int) total);
        long nc = findingRepository.countByInspectionIdAndConformity(insp.getId(),
                FindingConformity.NON_CONFORM);
        s.setNonConformCount((int) nc);
        long recorded = findingRepository
                .findByInspectionIdOrderByCheckpointDisplayOrderAsc(insp.getId()).stream()
                .filter(f -> f.getRawValue() != null && !f.getRawValue().isBlank())
                .count();
        s.setFindingsRecorded((int) recorded);
        return s;
    }
}
