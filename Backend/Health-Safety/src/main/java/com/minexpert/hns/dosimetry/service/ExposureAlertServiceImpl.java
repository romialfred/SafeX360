package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;
import com.minexpert.hns.dosimetry.dto.ExposureAlertEnrichedDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExposureAlertServiceImpl implements ExposureAlertService {

    private final ExposureAlertRepository repository;
    private final DosimetryAuditLogRepository auditLogRepository;
    private final ExposedWorkerRepository workerRepository;

    @Override
    public Long create(Long companyId, ExposureAlertDTO dto) {
        ExposureAlert e = toEntity(dto);
        LocalDateTime now = LocalDateTime.now();
        if (e.getTriggeredAt() == null) e.setTriggeredAt(now);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        ExposureAlert saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy(), null);
        return saved.getId();
    }

    @Override
    public void update(Long companyId, ExposureAlertDTO dto) {
        ExposureAlert existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("ExposureAlert not found: " + dto.getId()));
        existing.setWorkerId(dto.getWorkerId());
        existing.setZoneId(dto.getZoneId());
        existing.setLevel(dto.getLevel());
        existing.setGrandeur(dto.getGrandeur());
        existing.setValue(dto.getValue());
        existing.setThresholdId(dto.getThresholdId());
        existing.setAcknowledgedAt(dto.getAcknowledgedAt());
        existing.setAcknowledgedBy(dto.getAcknowledgedBy());
        existing.setStatus(dto.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(dto.getUpdatedBy());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy(), null);
    }

    @Override
    public List<ExposureAlertDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ExposureAlertDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ExposureAlert not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        // Une alerte ne se supprime pas : on l'acquitte (ACK) ou on la cloture (RESOLVED).
        // Cela preserve la chaine d'audit attendue par la radioprotection.
        throw new UnsupportedOperationException(
                "ExposureAlert delete forbidden — use acknowledge() or resolve() to close.");
    }

    // ----------------------------------------------------------------------------
    // Phase 5 — workflow ACTIVE -> ACK -> RESOLVED.
    // ----------------------------------------------------------------------------

    /**
     * Acquittement : l'utilisateur prend en compte l'alerte. Idempotence : on n'autorise
     * la transition qu'a partir du statut ACTIVE (sinon IllegalStateException). Ainsi,
     * un double-acknowledge concurrent leve une erreur claire au lieu de re-ecrire les
     * champs acknowledgedAt/By.
     */
    @Override
    @Transactional
    public void acknowledge(Long alertId, Long actorId, String note) {
        ExposureAlert alert = repository.findById(alertId)
                .orElseThrow(() -> new EntityNotFoundException("ExposureAlert not found: " + alertId));
        if (alert.getStatus() != AlertStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Invalid transition: ACK only allowed from ACTIVE (current=" + alert.getStatus() + ")");
        }
        LocalDateTime now = LocalDateTime.now();
        alert.setStatus(AlertStatus.ACK);
        alert.setAcknowledgedAt(now);
        alert.setAcknowledgedBy(actorId);
        alert.setUpdatedAt(now);
        alert.setUpdatedBy(actorId);
        repository.save(alert);
        String details = note != null
                ? String.format("{\"note\":\"%s\"}", escapeJson(note))
                : null;
        audit("ACK_ALERT", alertId, actorId, details);
    }

    /**
     * Resolution : cloture de l'alerte. Autorise depuis ACTIVE ou ACK (un RPO peut resoudre
     * directement sans passer par ACK, ex. faux positif). Refus depuis RESOLVED pour preserver
     * l'idempotence et la chaine d'audit (un resolve sur deja-resolved leve IllegalStateException).
     */
    @Override
    @Transactional
    public void resolve(Long alertId, Long actorId, String resolutionNote) {
        ExposureAlert alert = repository.findById(alertId)
                .orElseThrow(() -> new EntityNotFoundException("ExposureAlert not found: " + alertId));
        if (alert.getStatus() != AlertStatus.ACTIVE && alert.getStatus() != AlertStatus.ACK) {
            throw new IllegalStateException(
                    "Invalid transition: RESOLVE only allowed from ACTIVE or ACK (current="
                            + alert.getStatus() + ")");
        }
        LocalDateTime now = LocalDateTime.now();
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setUpdatedAt(now);
        alert.setUpdatedBy(actorId);
        repository.save(alert);
        String details = resolutionNote != null
                ? String.format("{\"resolutionNote\":\"%s\"}", escapeJson(resolutionNote))
                : null;
        audit("RESOLVE_ALERT", alertId, actorId, details);
    }

    @Override
    public List<ExposureAlertEnrichedDTO> findActiveByMine(Long mineId) {
        List<ExposureAlert> alerts = repository.findByMineIdAndStatus(mineId, AlertStatus.ACTIVE);
        return enrichWithWorker(alerts);
    }

    @Override
    public List<ExposureAlertEnrichedDTO> findActiveByWorker(Long workerId) {
        List<ExposureAlert> alerts = repository.findByWorkerIdAndStatus(workerId, AlertStatus.ACTIVE);
        return enrichWithWorker(alerts);
    }

    // ----------------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------------

    /**
     * Enrichit une liste d'alertes en effectuant un seul findAll(workerIds) pour minimiser
     * le nombre de requetes (evite le N+1).
     */
    private List<ExposureAlertEnrichedDTO> enrichWithWorker(List<ExposureAlert> alerts) {
        if (alerts == null || alerts.isEmpty()) return new ArrayList<>();
        List<Long> workerIds = alerts.stream()
                .map(ExposureAlert::getWorkerId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, ExposedWorker> byId = workerRepository.findAllById(workerIds).stream()
                .collect(Collectors.toMap(ExposedWorker::getId, w -> w));
        List<ExposureAlertEnrichedDTO> out = new ArrayList<>(alerts.size());
        for (ExposureAlert a : alerts) {
            ExposedWorker w = byId.get(a.getWorkerId());
            out.add(new ExposureAlertEnrichedDTO(
                    a.getId(), a.getWorkerId(), a.getZoneId(), a.getLevel(),
                    a.getGrandeur(), a.getValue(), a.getThresholdId(),
                    a.getTriggeredAt(), a.getAcknowledgedAt(), a.getAcknowledgedBy(),
                    a.getStatus(), a.getCreatedAt(), a.getUpdatedAt(),
                    a.getCreatedBy(), a.getUpdatedBy(),
                    w != null ? w.getEmployeeId() : null,
                    w != null ? w.getMineId() : null,
                    w != null ? w.getCategory() : null));
        }
        return out;
    }

    private void audit(String action, Long entityId, Long userId, String details) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("ExposureAlert").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now())
                .details(details).build());
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }

    private ExposureAlert toEntity(ExposureAlertDTO dto) {
        ExposureAlert e = new ExposureAlert();
        e.setId(dto.getId());
        e.setWorkerId(dto.getWorkerId());
        e.setZoneId(dto.getZoneId());
        e.setLevel(dto.getLevel());
        e.setGrandeur(dto.getGrandeur());
        e.setValue(dto.getValue());
        e.setThresholdId(dto.getThresholdId());
        e.setTriggeredAt(dto.getTriggeredAt());
        e.setAcknowledgedAt(dto.getAcknowledgedAt());
        e.setAcknowledgedBy(dto.getAcknowledgedBy());
        e.setStatus(dto.getStatus());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private ExposureAlertDTO toDTO(ExposureAlert e) {
        return new ExposureAlertDTO(e.getId(), e.getWorkerId(), e.getZoneId(),
                e.getLevel(), e.getGrandeur(), e.getValue(), e.getThresholdId(),
                e.getTriggeredAt(), e.getAcknowledgedAt(), e.getAcknowledgedBy(),
                e.getStatus(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy());
    }

    // Suppress unused warning while keeping Optional import documentation purpose.
    @SuppressWarnings("unused")
    private static <T> Optional<T> nullSafe(T t) { return Optional.ofNullable(t); }
}
