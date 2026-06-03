package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.AuditorDTO;
import com.minexpert.hns.entity.audit.Auditor;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditorServiceImpl implements AuditorService {

    private final AuditorRepository auditorRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDITORS_BY_AUDIT, key = "#auditorDTO.auditId", condition = "#auditorDTO.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDITOR_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS_PLANNING, allEntries = true)
    })
    public Long addAuditor(AuditorDTO auditorDTO) throws HSException {
        auditorDTO.setCreatedAt(LocalDateTime.now());
        auditorDTO.setUpdatedAt(LocalDateTime.now());
        return auditorRepository.save(auditorDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDITORS_BY_AUDIT, key = "#auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDITOR_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS_PLANNING, allEntries = true)
    })
    public List<Long> addAuditors(List<AuditorDTO> auditorDTOs, Long auditId) throws HSException {
        for (AuditorDTO auditorDTO : auditorDTOs) {
            auditorDTO.setCreatedAt(LocalDateTime.now());
            auditorDTO.setUpdatedAt(LocalDateTime.now());
            auditorDTO.setAuditId(auditId);
        }
        return ((List<Auditor>) auditorRepository.saveAll(auditorDTOs.stream().map(AuditorDTO::toEntity).toList()))
                .stream()
                .map(auditor -> auditor.getId()).toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDITORS_BY_AUDIT, key = "#auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDITOR_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS_PLANNING, allEntries = true)
    })
    public List<Long> addOrUpdateAuditors(List<AuditorDTO> auditorDTOs, Long auditId) throws HSException {
        for (AuditorDTO auditorDTO : auditorDTOs) {
            if (auditorDTO.getId() == null) {
                auditorDTO.setCreatedAt(LocalDateTime.now());
            }
            auditorDTO.setUpdatedAt(LocalDateTime.now());
            auditorDTO.setAuditId(auditId);
        }
        return ((List<Auditor>) auditorRepository.saveAll(auditorDTOs.stream().map(AuditorDTO::toEntity).toList()))
                .stream()
                .map(auditor -> auditor.getId()).toList();
    }

    @Override
    public void updateAuditor(AuditorDTO auditorDTO) throws HSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateAuditor'");
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDITOR_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDITORS_BY_AUDIT, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.LEAD_AUDITORS_PLANNING, allEntries = true)
    })
    public void deleteAuditor(Long id) throws HSException {
        auditorRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDITOR_BY_ID, key = "#id")
    public AuditorDTO getAuditorById(Long id) throws HSException {
        Auditor auditor = auditorRepository.findById(id).orElseThrow(() -> new HSException("AUDITOR_NOT_FOUND"));
        return auditor.toDTO();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDITORS_BY_AUDIT, key = "#auditId")
    public List<AuditorDTO> getAuditorsByAuditId(Long auditId) throws HSException {
        return ((List<Auditor>) auditorRepository.findByAudit_Id(auditId)).stream()
                .map(Auditor::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.LEAD_AUDITORS_PLANNING)
    public List<AuditorDTO> getLeadAuditorsForPlanning() throws HSException {
        return ((List<Auditor>) auditorRepository.findLeadAuditorsForPlanning()).stream()
                .map(Auditor::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.LEAD_AUDITORS)
    public List<AuditorDTO> getLeadAuditors() throws HSException {
        return ((List<Auditor>) auditorRepository.findLeadAuditors()).stream()
                .map(Auditor::toDTO)
                .toList();
    }

}
