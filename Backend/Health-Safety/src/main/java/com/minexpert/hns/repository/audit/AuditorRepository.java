package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.Auditor;

public interface AuditorRepository extends CrudRepository<Auditor, Long> {
    List<Auditor> findByAudit_Id(Long auditId);

    @Query("SELECT a FROM Auditor a " +
            "WHERE a.role = 'Lead Auditor' " +
            "AND a.audit.id IN (" +
            "SELECT au.id FROM Audit au " +
            "WHERE au.planningStatus IS NOT NULL)")
    List<Auditor> findLeadAuditorsForPlanning();

    @Query("SELECT a FROM Auditor a " +
            "WHERE a.role = 'Lead Auditor' " +
            "AND a.audit.id IN (" +
            "SELECT au.id FROM Audit au " +
            "WHERE au.planningStatus IS NULL " +
            "OR au.planningStatus = PlanningStatus.APPROVED)")
    List<Auditor> findLeadAuditors();
}
