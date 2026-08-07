package com.minexpert.hns.repository.compliance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.compliance.RegulatoryObligation;

public interface RegulatoryObligationRepository extends CrudRepository<RegulatoryObligation, Long> {

    @Query("SELECT o FROM RegulatoryObligation o WHERE (:companyId IS NULL OR o.companyId = :companyId) "
            + "ORDER BY o.id DESC")
    List<RegulatoryObligation> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT o.companyId FROM RegulatoryObligation o WHERE o.id = :id")
    Optional<Long> findCompanyIdById(@Param("id") Long id);

    long countByCompanyId(Long companyId);
}
