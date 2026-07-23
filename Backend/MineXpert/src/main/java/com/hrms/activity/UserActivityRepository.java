package com.hrms.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Page<UserActivity> findByAccountIdOrderByOccurredAtDesc(Long accountId, Pageable pageable);

    Page<UserActivity> findByAccountIdAndKindOrderByOccurredAtDesc(Long accountId, String kind,
            Pageable pageable);

    long countByAccountIdAndKind(Long accountId, String kind);
}
