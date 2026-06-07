package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.DoseCumulativeDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoseCumulativeServiceImpl implements DoseCumulativeService {

    private final DoseCumulativeRepository repository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, DoseCumulativeDTO dto) {
        DoseCumulative e = toEntity(dto);
        e.setUpdatedAt(LocalDateTime.now());
        DoseCumulative saved = repository.save(e);
        audit("CREATE", saved.getId());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, DoseCumulativeDTO dto) {
        DoseCumulative existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("DoseCumulative not found: " + dto.getId()));
        existing.setAnnualHp10(dto.getAnnualHp10());
        existing.setAnnualHp007(dto.getAnnualHp007());
        existing.setAnnualHp3(dto.getAnnualHp3());
        existing.setRolling5yHp10(dto.getRolling5yHp10());
        existing.setLifetimeHp10(dto.getLifetimeHp10());
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
        audit("UPDATE", existing.getId());
    }

    @Override
    public List<DoseCumulativeDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public DoseCumulativeDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DoseCumulative not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id);
    }

    @Override
    public DoseCumulativeDTO getByWorkerAndYear(Long workerId, int year) {
        return repository.findByWorkerIdAndYear(workerId, year).map(this::toDTO).orElse(null);
    }

    private void audit(String action, Long entityId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("DoseCumulative").entityId(entityId)
                .userId(0L).timestamp(LocalDateTime.now()).build());
    }

    private DoseCumulative toEntity(DoseCumulativeDTO dto) {
        DoseCumulative e = new DoseCumulative();
        e.setId(dto.getId());
        e.setWorkerId(dto.getWorkerId());
        e.setYear(dto.getYear());
        e.setAnnualHp10(dto.getAnnualHp10());
        e.setAnnualHp007(dto.getAnnualHp007());
        e.setAnnualHp3(dto.getAnnualHp3());
        e.setRolling5yHp10(dto.getRolling5yHp10());
        e.setLifetimeHp10(dto.getLifetimeHp10());
        return e;
    }

    private DoseCumulativeDTO toDTO(DoseCumulative e) {
        return new DoseCumulativeDTO(e.getId(), e.getWorkerId(), e.getYear(),
                e.getAnnualHp10(), e.getAnnualHp007(), e.getAnnualHp3(),
                e.getRolling5yHp10(), e.getLifetimeHp10(), e.getUpdatedAt());
    }
}
