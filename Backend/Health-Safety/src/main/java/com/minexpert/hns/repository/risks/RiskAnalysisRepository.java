package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.RiskAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RiskAnalysisRepository extends JpaRepository<RiskAnalysis, Long> {
    List<RiskAnalysis> findByRiskId(Long riskId);
}
