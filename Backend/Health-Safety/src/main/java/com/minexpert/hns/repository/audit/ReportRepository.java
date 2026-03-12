package com.minexpert.hns.repository.audit;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.Report;

public interface ReportRepository extends CrudRepository<Report, Long> {
    Optional<Report> findByAudit_Id(Long auditId);

    Boolean existsByAudit_Id(Long auditId);

}
