package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.enums.Status;

public interface IncidentCategoryRepository extends CrudRepository<IncidentCategory, Long> {

    Optional<IncidentCategory> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @org.springframework.data.jpa.repository.Query("SELECT i FROM IncidentCategory i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<IncidentCategory> findAllByCompanyId(@Param("companyId") Long companyId);

    @org.springframework.data.jpa.repository.Query("SELECT i.id AS id, i.name AS name, i.companyId AS companyId FROM IncidentCategory i WHERE i.status = :status AND (:companyId IS NULL OR i.companyId = :companyId)")
    List<IncidentCategoryResponse> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

}
