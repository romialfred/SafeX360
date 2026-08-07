package com.minexpert.hns.repository.compliance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.compliance.MandatoryInspection;

public interface MandatoryInspectionRepository extends CrudRepository<MandatoryInspection, Long> {

    @Query("SELECT i FROM MandatoryInspection i WHERE (:companyId IS NULL OR i.companyId = :companyId) "
            + "ORDER BY i.nextInspectionDate ASC")
    List<MandatoryInspection> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT i.companyId FROM MandatoryInspection i WHERE i.id = :id")
    Optional<Long> findCompanyIdById(@Param("id") Long id);

    long countByCompanyId(Long companyId);
}
