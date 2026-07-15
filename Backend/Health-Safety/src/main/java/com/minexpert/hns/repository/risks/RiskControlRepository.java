package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.RiskControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiskControlRepository extends JpaRepository<RiskControl, Long> {
    List<RiskControl> findBySourceTypeAndRiskId(String sourceType, Long riskId);

    @Query("SELECT c FROM RiskControl c WHERE c.sourceType = :sourceType AND c.riskId = :riskId "
            + "AND (:companyId IS NULL OR c.companyId = :companyId)")
    List<RiskControl> findBySourceTypeAndRiskIdAndCompany(@Param("sourceType") String sourceType,
            @Param("riskId") Long riskId, @Param("companyId") Long companyId);
}
