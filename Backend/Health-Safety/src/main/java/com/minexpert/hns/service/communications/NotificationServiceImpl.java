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
        public NotificationDTO create(NotificationDTO dto, Long companyId) throws HSException {
                Communication communication = communicationRepository.findById(dto.getCommunicationId())
                                .orElseThrow(() -> new HSException("COMMUNICATION_NOT_FOUND"));
                // Cloisonnement par mine : la communication parente (id du body) doit
                // relever de la mine appelante.
                assertCommunicationCompany(communication, companyId);
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
        public NotificationDTO update(NotificationDTO dto, Long companyId) throws HSException {
                Notification existing = notificationRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("NOTIFICATION_NOT_FOUND"));
                // Cloisonnement par mine : la notification ciblée doit relever de la mine
                // appelante (via sa Communication parente).
                verifyCompany(dto.getId(), companyId);
                Communication communication = dto.getCommunicationId() != null
                                ? communicationRepository.findById(dto.getCommunicationId())
                                                .orElseThrow(() -> new HSException("COMMUNICATION_NOT_FOUND"))
                                : existing.getCommunication();
                // Et la Communication cible (reparentage éventuel) également.
                assertCommunicationCompany(communication, companyId);
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
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_BY_ID, key = "#id + '-' + #companyId")
        public NotificationDTO getById(Long id, Long companyId) throws HSException {
                Notification notification = notificationRepository.findById(id)
                                .orElseThrow(() -> new HSException("NOTIFICATION_NOT_FOUND"));
                verifyCompany(id, companyId);
                return notification.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_SUMMARIES, key = "#companyId")
        public List<NotificationSummaryView> getAll(Long companyId) throws HSException {
                return notificationRepository.findAllProjectedByCompany(companyId);
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_ACTIVE, key = "#companyId")
        public List<NotificationDTO> getActive(Long companyId) throws HSException {
                return notificationRepository.findByStatusAndCompany(NotiRunStatus.SUCCESS, companyId)
                                .stream().map(Notification::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_EXPIRED, key = "#companyId")
        public List<NotificationDTO> getExpired(Long companyId) throws HSException {
                return notificationRepository.findByStatusAndCompany(NotiRunStatus.FAILURE, companyId)
                                .stream().map(Notification::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CommunicationCacheNames.NOTIFICATION_BY_COMMUNICATION,
                        key = "#communicationId + '-' + #companyId")
        public List<NotificationDTO> getByCommunicationId(Long communicationId, Long companyId)
                        throws HSException {
                Communication comm = communicationRepository.findById(communicationId)
                                .orElseThrow(() -> new HSException("COMMUNICATION_NOT_FOUND"));
                // Cloisonnement : la communication parente doit relever de la mine appelante.
                if (companyId != null && !companyId.equals(comm.getCompanyId())) {
                        throw new HSException("COMMUNICATION_NOT_FOUND");
                }
                return notificationRepository.findByCommunication_Id(communicationId)
                                .stream().map(Notification::toDTO)
                                .toList();
        }

        /**
         * Verifie qu'une notification releve de la mine appelante via sa
         * Communication parente. companyId null = pas de controle.
         */
        private void verifyCompany(Long notificationId, Long companyId) throws HSException {
                if (companyId == null) {
                        return;
                }
                Long parent = notificationRepository.findParentCompanyId(notificationId).orElse(null);
                if (parent != null && !companyId.equals(parent)) {
                        throw new HSException("NOTIFICATION_NOT_FOUND");
                }
        }

        /**
         * Verifie qu'une Communication parente releve de la mine appelante (creation
         * / reparentage d'une notification). companyId null = pas de controle.
         */
        private void assertCommunicationCompany(Communication communication, Long companyId)
                        throws HSException {
                if (companyId == null || communication == null) {
                        return;
                }
                if (!companyId.equals(communication.getCompanyId())) {
                        throw new HSException("COMMUNICATION_NOT_FOUND");
                }
        }
}
