package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.enums.Status;

public interface WorkAreaRepository extends CrudRepository<WorkArea, Long> {

    Optional<WorkArea> findByCompanyIdAndDepartmentIdAndNameIgnoreCase(Long companyId, Long departmentId, String name);

    @Query("SELECT w FROM WorkArea w WHERE (:companyId IS NULL OR w.companyId = :companyId)")
    List<WorkArea> findAllWithCompany(@Param("companyId") Long companyId);

    @Query("SELECT w FROM WorkArea w WHERE w.status = :status AND (:companyId IS NULL OR w.companyId = :companyId)")
    List<WorkArea> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT w FROM WorkArea w WHERE w.id = :id AND (:companyId IS NULL OR w.companyId = :companyId)")
    Optional<WorkArea> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);
}
