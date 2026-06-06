package com.minexpert.hns.api.emergency.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.AssemblyPointDTO;
import com.minexpert.hns.api.emergency.dto.AssemblyPointHistoryDTO;
import com.minexpert.hns.api.emergency.entity.AssemblyPoint;
import com.minexpert.hns.api.emergency.entity.AssemblyPointHistory;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.AssemblyPointHistoryRepository;
import com.minexpert.hns.api.emergency.repository.AssemblyPointRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service Points de rassemblement (LOT 48 Phase 2).
 *
 * <p>Chaque create/update/archive génère :</p>
 * <ul>
 *   <li>1 ligne {@code emergency_audit_log} (table de référence ISO 45001)</li>
 *   <li>1 ligne {@code assembly_point_history} (snapshot dédié pour timeline UI)</li>
 * </ul>
 *
 * <p>Le snapshot JSON est sérialisé "à la main" (sans dépendance Jackson externe)
 * pour rester compatible avec le reste du module audit.</p>
 */
@Service
@RequiredArgsConstructor
public class AssemblyPointService {

    private final AssemblyPointRepository repo;
    private final AssemblyPointHistoryRepository historyRepo;
    private final EmergencyAuditService auditService;

    // ─── Lecture ──────────────────────────────────────────────────────────────

    public List<AssemblyPointDTO> list(Long companyId, boolean includeArchived) {
        List<AssemblyPoint> list = includeArchived
            ? repo.findByCompanyIdOrderByEvacuationPriorityAscNameAsc(companyId)
            : repo.findByCompanyIdAndStatusOrderByEvacuationPriorityAscNameAsc(companyId, "ACTIVE");
        return list.stream().map(this::toDto).toList();
    }

    public Optional<AssemblyPointDTO> get(Long id) {
        return repo.findById(id).map(this::toDto);
    }

    public List<AssemblyPointHistoryDTO> history(Long assemblyPointId) {
        return historyRepo.findByAssemblyPointIdOrderByCreatedAtDesc(assemblyPointId)
            .stream().map(this::toHistoryDto).toList();
    }

    // ─── Écriture ─────────────────────────────────────────────────────────────

    @Transactional
    public AssemblyPointDTO create(AssemblyPointDTO dto, Long actorId) {
        AssemblyPoint ap = new AssemblyPoint();
        applyDto(ap, dto);
        if (ap.getEvacuationPriority() == null) ap.setEvacuationPriority(2);
        if (ap.getStatus() == null) ap.setStatus("ACTIVE");

        AssemblyPoint saved = repo.save(ap);
        recordHistory(saved, "created", actorId, "Création du point de rassemblement");
        auditService.log(
            EmergencyAuditEventType.ASSEMBLY_POINT_CREATED,
            actorId, saved.getCompanyId(),
            "AssemblyPoint", saved.getId(), null, null, null
        );
        return toDto(saved);
    }

    @Transactional
    public Optional<AssemblyPointDTO> update(Long id, AssemblyPointDTO dto, Long actorId) {
        return repo.findById(id).map(existing -> {
            List<String> diffs = computeDiffs(existing, dto);
            applyDto(existing, dto);
            AssemblyPoint saved = repo.save(existing);
            String diffSummary = diffs.isEmpty() ? "(aucun champ modifié)" : String.join(" · ", diffs);
            recordHistory(saved, "updated", actorId, diffSummary);
            auditService.log(
                EmergencyAuditEventType.ASSEMBLY_POINT_UPDATED,
                actorId, saved.getCompanyId(),
                "AssemblyPoint", saved.getId(),
                jsonStr(diffSummary), null, null
            );
            return toDto(saved);
        });
    }

    @Transactional
    public boolean archive(Long id, Long actorId) {
        return repo.findById(id).map(ap -> {
            ap.setStatus("ARCHIVED");
            AssemblyPoint saved = repo.save(ap);
            recordHistory(saved, "archived", actorId, "Archivage (soft-delete)");
            auditService.log(
                EmergencyAuditEventType.ASSEMBLY_POINT_ARCHIVED,
                actorId, saved.getCompanyId(),
                "AssemblyPoint", saved.getId(), null, null, null
            );
            return true;
        }).orElse(false);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void applyDto(AssemblyPoint ap, AssemblyPointDTO dto) {
        if (dto.getName() != null) ap.setName(dto.getName());
        if (dto.getDescription() != null) ap.setDescription(dto.getDescription());
        if (dto.getLocationText() != null) ap.setLocationText(dto.getLocationText());
        if (dto.getLatitude() != null) ap.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) ap.setLongitude(dto.getLongitude());
        if (dto.getManagerId() != null) ap.setManagerId(dto.getManagerId());
        if (dto.getDeputyManagerId() != null) ap.setDeputyManagerId(dto.getDeputyManagerId());
        if (dto.getCameraId() != null) ap.setCameraId(dto.getCameraId());
        if (dto.getEvacuationPriority() != null) ap.setEvacuationPriority(dto.getEvacuationPriority());
        if (dto.getMaxCapacity() != null) ap.setMaxCapacity(dto.getMaxCapacity());
        if (dto.getStatus() != null) ap.setStatus(dto.getStatus());
        if (dto.getCompanyId() != null) ap.setCompanyId(dto.getCompanyId());
        if (dto.getDepartmentIdsCsv() != null) ap.setDepartmentIdsCsv(dto.getDepartmentIdsCsv());
    }

    private List<String> computeDiffs(AssemblyPoint before, AssemblyPointDTO after) {
        List<String> diffs = new ArrayList<>();
        if (after.getName() != null && !after.getName().equals(before.getName()))
            diffs.add("nom");
        if (after.getLatitude() != null && !after.getLatitude().equals(before.getLatitude()))
            diffs.add("latitude");
        if (after.getLongitude() != null && !after.getLongitude().equals(before.getLongitude()))
            diffs.add("longitude");
        if (after.getEvacuationPriority() != null && !after.getEvacuationPriority().equals(before.getEvacuationPriority()))
            diffs.add("priorité");
        if (after.getManagerId() != null && !after.getManagerId().equals(before.getManagerId()))
            diffs.add("responsable");
        if (after.getDeputyManagerId() != null && !after.getDeputyManagerId().equals(before.getDeputyManagerId()))
            diffs.add("adjoint");
        if (after.getMaxCapacity() != null && !after.getMaxCapacity().equals(before.getMaxCapacity()))
            diffs.add("capacité");
        if (after.getStatus() != null && !after.getStatus().equals(before.getStatus()))
            diffs.add("statut");
        if (after.getDepartmentIdsCsv() != null && !after.getDepartmentIdsCsv().equals(before.getDepartmentIdsCsv()))
            diffs.add("départements");
        if (after.getDescription() != null && !after.getDescription().equals(before.getDescription()))
            diffs.add("description");
        if (after.getLocationText() != null && !after.getLocationText().equals(before.getLocationText()))
            diffs.add("adresse");
        return diffs;
    }

    private void recordHistory(AssemblyPoint ap, String action, Long actorId, String diffSummary) {
        AssemblyPointHistory h = new AssemblyPointHistory();
        h.setAssemblyPointId(ap.getId());
        h.setCompanyId(ap.getCompanyId());
        h.setAction(action);
        h.setActorId(actorId);
        h.setSnapshotJson(toSnapshotJson(ap));
        h.setDiffSummary(diffSummary);
        historyRepo.save(h);
    }

    /**
     * Sérialisation manuelle du snapshot — évite une dépendance Jackson dédiée
     * ici et préserve la cohérence avec le format payload du module audit.
     */
    private String toSnapshotJson(AssemblyPoint ap) {
        return "{"
            + "\"id\":" + ap.getId()
            + ",\"name\":" + jsonStr(ap.getName())
            + ",\"latitude\":" + ap.getLatitude()
            + ",\"longitude\":" + ap.getLongitude()
            + ",\"managerId\":" + ap.getManagerId()
            + ",\"deputyManagerId\":" + ap.getDeputyManagerId()
            + ",\"evacuationPriority\":" + ap.getEvacuationPriority()
            + ",\"maxCapacity\":" + ap.getMaxCapacity()
            + ",\"status\":" + jsonStr(ap.getStatus())
            + ",\"departmentIdsCsv\":" + jsonStr(ap.getDepartmentIdsCsv())
            + "}";
    }

    private String jsonStr(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private AssemblyPointDTO toDto(AssemblyPoint ap) {
        return AssemblyPointDTO.builder()
            .id(ap.getId())
            .name(ap.getName())
            .description(ap.getDescription())
            .locationText(ap.getLocationText())
            .latitude(ap.getLatitude())
            .longitude(ap.getLongitude())
            .managerId(ap.getManagerId())
            .deputyManagerId(ap.getDeputyManagerId())
            .cameraId(ap.getCameraId())
            .evacuationPriority(ap.getEvacuationPriority())
            .maxCapacity(ap.getMaxCapacity())
            .status(ap.getStatus())
            .companyId(ap.getCompanyId())
            .departmentIdsCsv(ap.getDepartmentIdsCsv())
            .build();
    }

    private AssemblyPointHistoryDTO toHistoryDto(AssemblyPointHistory h) {
        return AssemblyPointHistoryDTO.builder()
            .id(h.getId())
            .assemblyPointId(h.getAssemblyPointId())
            .companyId(h.getCompanyId())
            .action(h.getAction())
            .actorId(h.getActorId())
            .snapshotJson(h.getSnapshotJson())
            .diffSummary(h.getDiffSummary())
            .createdAt(h.getCreatedAt())
            .build();
    }
}
