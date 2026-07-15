package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.RiskAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiskAnalysisRepository extends JpaRepository<RiskAnalysis, Long> {
    List<RiskAnalysis> findByRiskId(Long riskId);

    @Query("SELECT a FROM RiskAnalysis a WHERE a.risk.id = :riskId "
            + "AND (:companyId IS NULL OR a.companyId = :companyId)")
    List<RiskAnalysis> findByRiskIdAndCompany(@Param("riskId") Long riskId, @Param("companyId") Long companyId);

    @Query("SELECT a FROM RiskAnalysis a WHERE (:companyId IS NULL OR a.companyId = :companyId)")
    List<RiskAnalysis> findAllByCompany(@Param("companyId") Long companyId);
}
