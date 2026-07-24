package com.minexpert.hns.policy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.policy.entity.HsPolicyAcknowledgement;

public interface HsPolicyAcknowledgementRepository extends JpaRepository<HsPolicyAcknowledgement, Long> {

    Optional<HsPolicyAcknowledgement> findByPolicyIdAndAccountId(Long policyId, Long accountId);

    List<HsPolicyAcknowledgement> findByPolicyIdOrderByAcknowledgedAtDesc(Long policyId);

    long countByPolicyId(Long policyId);
}
