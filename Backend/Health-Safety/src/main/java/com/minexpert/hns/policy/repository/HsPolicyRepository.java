package com.minexpert.hns.policy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.policy.entity.HsPolicy;
import com.minexpert.hns.policy.enums.HsPolicyStatus;

public interface HsPolicyRepository extends JpaRepository<HsPolicy, Long> {

    Optional<HsPolicy> findFirstByCompanyIdAndStatusOrderByVersionDesc(Long companyId, HsPolicyStatus status);

    List<HsPolicy> findByCompanyIdOrderByVersionDesc(Long companyId);

    Optional<HsPolicy> findByIdAndCompanyId(Long id, Long companyId);

    /** Plus haute version connue pour la mine — sert à numéroter la publication suivante. */
    Optional<HsPolicy> findFirstByCompanyIdOrderByVersionDesc(Long companyId);
}
