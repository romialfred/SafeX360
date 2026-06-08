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
import com.minexpert.hns.entity.inspections.InspectionTemplate;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.enums.CheckpointResponseType;
import com.minexpert.hns.enums.FindingConformity;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.inspections.dto.ApprovalDTO;
import com.minexpert.hns.inspections.dto.FindingDTO;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;
import com.minexpert.hns.inspections.dto.InspectionSummaryDTO;
import com.minexpert.hns.inspections.dto.ScheduleInspectionDTO;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.repository.inspections.InspectionApprovalRepository;
import com.minexpert.hns.repository.inspections.InspectionCheckpointRepository;
import com.minexpert.hns.repository.inspections.InspectionFindingRepository;
import com.minexpert.hns.repository.inspections.InspectionHistoryRepository;
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
    @Autowired(required = false)
    private InspectionHistoryRepository historyRepository;

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
    public Long schedule(ScheduleInspectionDTO dto, Long userId) {
        InspectionTemplate tpl = templateRepository.findById(dto.getTemplateId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Template introuvable : " + dto.getTemplateId()));
        if (!Boolean.TRUE.equals(tpl.getActive())) {
            throw new IllegalStateException("Le template '" + tpl.getCode() + "' est inactif.");
        }

        GeneralInspection inspection = new GeneralInspection();
        Location site = new Location();
        site.setId(dto.getSiteId());
        inspection.setSite(site);
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
        inspection.setCreatedAt(LocalDateTime.now());
        inspection.setUpdatedAt(LocalDateTime.now());
        // Note : la colonne activity_id est NOT NULL en BDD pour rétro-compat.
        // En cas d'activité absente côté nouveau workflow, on saute la
        // validation : c'est le service appelant qui doit fournir un id
        // d'activité valide. Pour simplifier la refonte, le frontend sera
        // responsable de pré-creer un Activity ou on assouplira plus tard.
        // [TODO Phase 2.b : assouplir le NOT NULL ou créer auto une activité]

        GeneralInspection saved = inspectionRepository.save(inspection);

        // Cree un finding vide pour chaque checkpoint
        for (InspectionCheckpoint cp : tpl.getCheckpoints()) {
            InspectionFinding f = new InspectionFinding();
            f.setInspection(saved);
            f.setCheckpoint(cp);
            f.setConformity(FindingConformity.NOT_APPLICABLE);
            f.setRecordedAt(LocalDateTime.now());
            findingRepository.save(f);
        }

        logHistory(saved, null, InspectionStatus.SCHEDULED, userId,
                "Inspection planifiee avec template " + tpl.getCode());
        return saved.getId();
    }

    // ─────────────────────────────────────────────────────────────
    //  Execution terrain
    // ─────────────────────────────────────────────────────────────

    /** Marque l'inspection comme demarree (passage IN_PROGRESS). */
    @Transactional
    public void start(Long inspectionId, Long userId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertStatusIn(insp, "demarrer", InspectionStatus.SCHEDULED);
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
    public void saveFindings(Long inspectionId, List<FindingDTO> dtos, Long userId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        assertStatusIn(insp, "saisir des findings",
                InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS);
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
    public void updateSummary(Long inspectionId, String summary, Long userId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        if (insp.getStatus() == InspectionStatus.APPROVED
                || insp.getStatus() == InspectionStatus.ARCHIVED) {
            throw new IllegalStateException(
                    "La synthese n'est plus modifiable apres approbation/archivage.");
        }
        insp.setSummaryReport(summary);
        insp.setUpdatedAt(LocalDateTime.now());
        inspectionRepository.save(insp);
    }

    // ─────────────────────────────────────────────────────────────
    //  Soumission et validation
    // ─────────────────────────────────────────────────────────────

    /**
     * Soumet l'inspection pour validation equipe. Verifie au passage que
     * tous les findings requis ont une reponse.
     */
    @Transactional
    public void submit(Long inspectionId, Long userId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
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
    public void decide(Long inspectionId, ApprovalDTO dto, Long userId, int expectedApproverCount) {
        GeneralInspection insp = loadOrThrow(inspectionId);
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
    public InspectionDetailDTO getDetail(Long inspectionId) {
        GeneralInspection insp = loadOrThrow(inspectionId);
        return toDetailDTO(insp);
    }

    /** Registre des inspections (toutes mines, tous statuts). */
    @Transactional(readOnly = true)
    public List<InspectionSummaryDTO> listAll() {
        List<GeneralInspection> all = new ArrayList<>();
        inspectionRepository.findAll().forEach(all::add);
        all.sort(Comparator.comparing(GeneralInspection::getPlannedDate,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return all.stream().map(this::toSummaryDTO).toList();
    }

    // ─────────────────────────────────────────────────────────────
    //  Helpers internes
    // ─────────────────────────────────────────────────────────────

    private GeneralInspection loadOrThrow(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inspection introuvable : " + id));
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
