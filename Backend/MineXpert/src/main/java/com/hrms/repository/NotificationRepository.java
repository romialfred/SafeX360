package com.hrms.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Notification;

public interface NotificationRepository extends CrudRepository<Notification, Long> {
    public List<Notification> findByAccountId(Long accountId);
}
