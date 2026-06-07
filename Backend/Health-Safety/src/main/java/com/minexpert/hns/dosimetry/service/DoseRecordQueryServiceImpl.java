package com.minexpert.hns.dosimetry.service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementation read-only des requetes sur DoseRecord. Voir {@link DoseRecordQueryService}.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DoseRecordQueryServiceImpl implements DoseRecordQueryService {

    private final DoseRecordRepository repository;

    @Override
    public List<DoseRecordDTO> findActiveByWorker(Long workerId) {
        return repository.findActiveByWorkerId(workerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DoseRecordDTO> findByWorkerYear(Long workerId, int year) {
        return repository.findActiveByWorkerIdAndYear(workerId, String.valueOf(year)).stream()
                .sorted(Comparator.comparing(DoseRecord::getPeriod,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DoseRecordDTO> findHistoryByWorkerWithVersions(Long workerId, String period) {
        return repository.findAllVersionsByWorkerIdAndPeriod(workerId, period).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private DoseRecordDTO toDTO(DoseRecord e) {
        return new DoseRecordDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriod(), e.getHp10(), e.getHp007(), e.getHp3(), e.getSource(),
                e.isBelowDetection(), e.getAttachmentUrls(), e.getNotes(),
                e.getRecordedBy(), e.getRecordedAt(), e.getVersion(), e.getSupersededRecordId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
