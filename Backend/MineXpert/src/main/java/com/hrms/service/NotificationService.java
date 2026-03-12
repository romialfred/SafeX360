package com.hrms.service;

import java.util.List;

import com.hrms.dto.NotificationDTO;
import com.hrms.exception.HRMSException;

public interface NotificationService {
     public void sendNotification(NotificationDTO notificationDTO) throws HRMSException;
     public List<NotificationDTO> getNotifications(Long accountId);
     public void deleteNotification(Long id);
    
}
