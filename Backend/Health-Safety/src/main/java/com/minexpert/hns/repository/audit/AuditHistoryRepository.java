package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.AuditHistory;

public interface AuditHistoryRepository extends CrudRepository<AuditHistory, Long> {
    List<AuditHistory> findByAudit_Id(Long auditId);
}
