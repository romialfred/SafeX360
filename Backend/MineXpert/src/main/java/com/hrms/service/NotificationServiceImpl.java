package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.NotificationDTO;
import com.hrms.exception.HRMSException;
import com.hrms.repository.NotificationRepository;

@Service
public class NotificationServiceImpl implements NotificationService {

      @Autowired
	private NotificationRepository notificationRepository;

    @Override
    public void sendNotification(NotificationDTO notificationDTO) throws HRMSException {
        notificationRepository.save(notificationDTO.toEntity());
    }

    @Override
    public List<NotificationDTO> getNotifications(Long accountId) {
        return notificationRepository.findByAccountId(accountId).stream().map(x->x.toDTO()).toList();
    }

    @Override
    public void deleteNotification(Long id) {
         notificationRepository.deleteById(id);
    }
    
}
