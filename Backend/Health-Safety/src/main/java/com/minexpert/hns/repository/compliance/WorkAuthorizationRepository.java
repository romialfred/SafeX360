package com.minexpert.hns.repository.compliance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.compliance.WorkAuthorization;

public interface WorkAuthorizationRepository extends CrudRepository<WorkAuthorization, Long> {

    @Query("SELECT a FROM WorkAuthorization a WHERE (:companyId IS NULL OR a.companyId = :companyId) "
            + "ORDER BY a.validTo DESC")
    List<WorkAuthorization> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT a.companyId FROM WorkAuthorization a WHERE a.id = :id")
    Optional<Long> findCompanyIdById(@Param("id") Long id);

    long countByCompanyId(Long companyId);
}
