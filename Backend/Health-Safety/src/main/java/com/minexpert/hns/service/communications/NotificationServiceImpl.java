package com.minexpert.hns.service.communications;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.CommunicationCacheNames;
import com.minexpert.hns.dto.communications.NotificationDTO;
import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.entity.communications.NotiRunStatus;
import com.minexpert.hns.entity.communications.Notification;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.CommTimeRepository;
import com.minexpert.hns.repository.communications.CommunicationRepository;
import com.minexpert.hns.repository.communications.NotificationRepository;
import com.minexpert.hns.repository.communications.projection.NotificationSummaryView;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
        private final NotificationRepository notificationRepository;
        private final CommunicationRepository communicationRepository;
        private final CommTimeRepository commTimeRepository;

        @Override
        @CacheEvict(cacheNames = {
                        CommunicationCacheNames.NOTIFICATION_SUMMARIES,
                        CommunicationCacheNames.NOTIFICATION_ACTIVE,
                        CommunicationCacheNames.NOTIFICATION_EXPIRED,
                        CommunicationCacheNames.NOTIFICATION_BY_COMMUNICATION
        }, allEntries = true)
        public NotificationDTO create(NotificationDTO dto) throws HSException {
                Communication communication = communicationRepository.findById(dto.getCommunicationId())
                                .orElseThrow(() -> new HSException("COMMUNICATION_NOT_FOUND"));
                CommTime commTime = commTimeRepository.findById(dto.getCommTimeId())
                                .orElseThrow(() -> new HSException("COMM_TIME_NOT_FOUND"));
                Notification notification = dto.toEntity(communication, commTime);
                Notification saved = notificationRepository.save(notification);
                return saved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = CommunicationCacheNames.NOTIFICATION_BY_ID, key = "#dto.id"),
                        @CacheEvict(cacheNames = {
                                        CommunicationCacheNames.NOTIFICATION_SUMMARIES,
                                        CommunicationCacheNames.NOTIFICATION_ACTIVE,
                                        CommunicationCacheNames.NOTIFICATION_EXPIRED,
                                        CommunicationCacheNames.NOTIFICATION_BY_COMMUNICATION
                        }, allEntries = true)
        })
        public NotificationDTO update(NotificationDTO dto) throws HSException {
                Notification existing = notificationRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("NOTIFICATION_NOT_FOUND"));
                Communication communication = dto.getCommunicationId() != null
                                ? communicationRepository.findById(dto.getCommunicationId())
                                                .orElseThrow(() -> new HSException("COMMUNICATION_NOT_FOUND"))
                                : existing.getCommunication();
                CommTime commTime = dto.getCommTimeId() != null
                                ? commTimeRepository.findById(dto.getCommTimeId())
                                                .orElseThrow(() -> new HSException("COMM_TIME_NOT_FOUND"))
                                : existing.getCommTime();
                Notification updated = dto.toEntity(communication, commTime);
                updated.setId(existing.getId());
                updated.setCreatedAt(existing.getCreatedAt());
                Notification saved = notificationRepository.save(updated);
                return saved.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_BY_ID, key = "#id")
        public NotificationDTO getById(Long id) throws HSException {
                Notification notification = notificationRepository.findById(id)
                                .orElseThrow(() -> new HSException("NOTIFICATION_NOT_FOUND"));
                return notification.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_SUMMARIES)
        public List<NotificationSummaryView> getAll() throws HSException {
                return notificationRepository.findAllProjectedBy();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_ACTIVE)
        public List<NotificationDTO> getActive() throws HSException {
                return notificationRepository.findByStatus(NotiRunStatus.SUCCESS)
                                .stream().map(Notification::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_EXPIRED)
        public List<NotificationDTO> getExpired() throws HSException {
                return notificationRepository.findByStatus(NotiRunStatus.FAILURE)
                                .stream().map(Notification::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_BY_COMMUNICATION, key = "#communicationId")
        public List<NotificationDTO> getByCommunicationId(Long communicationId) throws HSException {
                if (!communicationRepository.existsById(communicationId)) {
                        throw new HSException("COMMUNICATION_NOT_FOUND");
                }
                return notificationRepository.findByCommunication_Id(communicationId)
                                .stream().map(Notification::toDTO)
                                .toList();
        }
}
