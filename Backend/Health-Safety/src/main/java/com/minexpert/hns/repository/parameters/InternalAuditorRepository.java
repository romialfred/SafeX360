package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.InternalAuditor;

public interface InternalAuditorRepository extends CrudRepository<InternalAuditor, Long> {
    Optional<InternalAuditor> findByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    @Query("SELECT i FROM InternalAuditor i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<InternalAuditor> findAllWithCompany(@Param("companyId") Long companyId);

    @Query("SELECT i FROM InternalAuditor i WHERE i.id = :id AND (:companyId IS NULL OR i.companyId = :companyId)")
    Optional<InternalAuditor> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);
}
