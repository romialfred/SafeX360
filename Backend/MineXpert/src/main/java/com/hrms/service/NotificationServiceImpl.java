package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.NotificationDTO;
import com.hrms.exception.HRMSException;
import com.hrms.repository.NotificationRepository;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "notificationsByAccount", key = "#notificationDTO.accountId", condition = "#notificationDTO.accountId != null")
    })
    public void sendNotification(NotificationDTO notificationDTO) throws HRMSException {
        notificationRepository.save(notificationDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "notificationsByAccount", key = "#accountId")
    public List<NotificationDTO> getNotifications(Long accountId) {
        return notificationRepository.findByAccountId(accountId).stream().map(notification -> notification.toDTO())
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "notificationsByAccount", allEntries = true)
    })
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

}
