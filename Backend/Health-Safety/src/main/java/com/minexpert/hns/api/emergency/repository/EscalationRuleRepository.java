package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.EscalationRule;

public interface EscalationRuleRepository extends JpaRepository<EscalationRule, Long> {
    List<EscalationRule> findByCompanyIdOrderByStepOrderAsc(Long companyId);
    List<EscalationRule> findByCompanyIdAndStatusOrderByStepOrderAsc(Long companyId, String status);
}
