package com.minexpert.hns.service.communications;

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
    public NotificationDTO getById(Long id) throws HSException {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new HSException("NOTIFICATION_NOT_FOUND"));
        return notification.toDTO();
    }

    @Override
    public List<NotificationSummaryView> getAll() throws HSException {
        return notificationRepository.findAllProjectedBy();
    }

    @Override
    public List<NotificationDTO> getActive() throws HSException {
        return notificationRepository.findByStatus(NotiRunStatus.SUCCESS)
                .stream().map(Notification::toDTO)
                .toList();
    }

    @Override
    public List<NotificationDTO> getExpired() throws HSException {
        return notificationRepository.findByStatus(NotiRunStatus.FAILURE)
                .stream().map(Notification::toDTO)
                .toList();
    }

    @Override
    public List<NotificationDTO> getByCommunicationId(Long communicationId) throws HSException {
        if (!communicationRepository.existsById(communicationId)) {
            throw new HSException("COMMUNICATION_NOT_FOUND");
        }
        return notificationRepository.findByCommunication_Id(communicationId)
                .stream().map(Notification::toDTO)
                .toList();
    }
}
