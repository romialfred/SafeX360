package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.AuditHistoryDTO;
import com.minexpert.hns.entity.audit.AuditHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditHistoryServiceImpl implements AuditHistoryService {

    private final AuditHistoryRepository auditHistoryRepository;

    private final AuditService auditService;

    @Override
    public Long saveAuditHistory(AuditHistoryDTO auditHistoryDTO) throws HSException {
        auditHistoryDTO.setCreatedAt(LocalDateTime.now());
        auditService.updateAuditStatus(auditHistoryDTO.getAuditId(), auditHistoryDTO.getStatus());
        return auditHistoryRepository.save(auditHistoryDTO.toEntity()).getId();
    }

    @Override
    public List<AuditHistoryDTO> getAuditHistoryByAuditId(Long auditId) throws HSException {
        return auditHistoryRepository.findByAudit_Id(auditId).stream()
                .map(AuditHistory::toDTO)
                .toList();
    }

}
