package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    List<Opportunity> findAllByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Opportunity o WHERE (:companyId IS NULL OR o.companyId = :companyId) "
            + "ORDER BY o.createdAt DESC")
    List<Opportunity> findAllByCompanyOrderByCreatedAtDesc(@Param("companyId") Long companyId);
}
