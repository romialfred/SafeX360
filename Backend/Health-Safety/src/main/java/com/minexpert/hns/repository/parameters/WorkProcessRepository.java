package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.Status;

public interface WorkProcessRepository extends CrudRepository<WorkProcess, Long> {
    Optional<WorkProcess> findByCompanyIdAndDepartmentIdAndNameIgnoreCase(Long companyId, Long departmentId,
            String name);

    @Query("SELECT w FROM WorkProcess w WHERE (:companyId IS NULL OR w.companyId = :companyId)")
    List<WorkProcess> findAllWithCompany(@Param("companyId") Long companyId);

    @Query("SELECT w FROM WorkProcess w WHERE w.status = :status AND (:companyId IS NULL OR w.companyId = :companyId)")
    List<WorkProcess> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT w FROM WorkProcess w WHERE w.id = :id AND (:companyId IS NULL OR w.companyId = :companyId)")
    Optional<WorkProcess> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);
}
