package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.RiskControl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskControlRepository extends JpaRepository<RiskControl, Long> {
    List<RiskControl> findBySourceTypeAndRiskId(String sourceType, Long riskId);
}
