package com.minexpert.hns.policy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.policy.entity.HsPolicyArticle;

public interface HsPolicyArticleRepository extends JpaRepository<HsPolicyArticle, Long> {

    List<HsPolicyArticle> findByPolicyIdOrderByOrderIndexAsc(Long policyId);

    @Transactional
    void deleteByPolicyId(Long policyId);
}
