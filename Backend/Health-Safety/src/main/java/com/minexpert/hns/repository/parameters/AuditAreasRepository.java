package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.Status;

public interface AuditAreasRepository extends CrudRepository<AuditAreas, Long> {

    Optional<AuditAreas> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @Query("SELECT a FROM AuditAreas a WHERE a.status = :status AND (:companyId IS NULL OR a.companyId = :companyId)")
    List<AuditAreas> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT a FROM AuditAreas a WHERE (:companyId IS NULL OR a.companyId = :companyId)")
    List<AuditAreas> findAllByCompanyId(@Param("companyId") Long companyId);

}
