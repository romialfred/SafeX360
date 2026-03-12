package com.hrms.repository;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.AuditLog;

public interface AuditLogRepository extends CrudRepository<AuditLog, Long> {
    
}
