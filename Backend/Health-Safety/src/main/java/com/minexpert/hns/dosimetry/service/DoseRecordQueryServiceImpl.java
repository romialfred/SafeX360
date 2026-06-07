package com.minexpert.hns.dosimetry.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementation read-only des requetes sur DoseRecord. Voir {@link DoseRecordQueryService}.
 *
 * <p>Enrichissement RH : chaque DTO retourné se voit attribuer {@code workerName} et
 * {@code matricule} via {@link EmployeeLookupService}. Les requêtes étant toutes
 * mono-worker, on fait un seul lookup unitaire (pas de batch nécessaire).
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DoseRecordQueryServiceImpl implements DoseRecordQueryService {

    private final DoseRecordRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final EmployeeLookupService employeeLookupService;

    @Override
    public List<DoseRecordDTO> findActiveByWorker(Long workerId) {
        EmployeeLookupService.EmployeeInfo info = resolveEmployeeForWorker(workerId);
        return repository.findActiveByWorkerId(workerId).stream()
                .map(e -> toDTO(e, info))
                .collect(Collectors.toList());
    }

    @Override
    public List<DoseRecordDTO> findByWorkerYear(Long workerId, int year) {
        EmployeeLookupService.EmployeeInfo info = resolveEmployeeForWorker(workerId);
        return repository.findActiveByWorkerIdAndYear(workerId, String.valueOf(year)).stream()
                .sorted(Comparator.comparing(DoseRecord::getPeriod,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(e -> toDTO(e, info))
                .collect(Collectors.toList());
    }

    @Override
    public List<DoseRecordDTO> findHistoryByWorkerWithVersions(Long workerId, String period) {
        EmployeeLookupService.EmployeeInfo info = resolveEmployeeForWorker(workerId);
        return repository.findAllVersionsByWorkerIdAndPeriod(workerId, period).stream()
                .map(e -> toDTO(e, info))
                .collect(Collectors.toList());
    }

    /**
     * Récupère les données RH du worker (un seul appel BDD par requête). Retourne null si le
     * worker n'existe pas ou si l'enrichissement RH est indisponible.
     */
    private EmployeeLookupService.EmployeeInfo resolveEmployeeForWorker(Long workerId) {
        if (workerId == null || workerRepository == null || employeeLookupService == null) {
            return null;
        }
        Long employeeId = workerRepository.findById(workerId)
                .map(w -> w.getEmployeeId())
                .orElse(null);
        if (employeeId == null) {
            return null;
        }
        return employeeLookupService.resolveOne(employeeId).orElse(null);
    }

    private DoseRecordDTO toDTO(DoseRecord e, EmployeeLookupService.EmployeeInfo info) {
        return new DoseRecordDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriod(), e.getHp10(), e.getHp007(), e.getHp3(), e.getSource(),
                e.isBelowDetection(), e.getAttachmentUrls(), e.getNotes(),
                e.getRecordedBy(), e.getRecordedAt(), e.getVersion(), e.getSupersededRecordId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy(),
                info != null ? info.fullName() : null,
                info != null ? info.matricule() : null);
    }
}
