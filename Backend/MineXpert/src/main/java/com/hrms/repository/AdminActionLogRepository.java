package com.hrms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hrms.entity.AdminActionLog;

@Repository
public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    Page<AdminActionLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<AdminActionLog> findByTargetAccountIdOrderByCreatedAtDesc(Long targetAccountId, Pageable pageable);
}
