package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.AuditHistoryDTO;
import com.minexpert.hns.entity.audit.AuditHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditHistoryRepository;
import com.minexpert.hns.config.AuditCacheNames;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditHistoryServiceImpl implements AuditHistoryService {

    private final AuditHistoryRepository auditHistoryRepository;

    private final AuditService auditService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_HISTORY_BY_AUDIT, key = "#auditHistoryDTO.auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#auditHistoryDTO.auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#auditHistoryDTO.auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public Long saveAuditHistory(AuditHistoryDTO auditHistoryDTO) throws HSException {
        auditHistoryDTO.setCreatedAt(LocalDateTime.now());
        auditService.updateAuditStatus(auditHistoryDTO.getAuditId(), auditHistoryDTO.getStatus());
        return auditHistoryRepository.save(auditHistoryDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_HISTORY_BY_AUDIT, key = "#auditId")
    public List<AuditHistoryDTO> getAuditHistoryByAuditId(Long auditId) throws HSException {
        return auditHistoryRepository.findByAudit_Id(auditId).stream()
                .map(AuditHistory::toDTO)
                .toList();
    }

}
