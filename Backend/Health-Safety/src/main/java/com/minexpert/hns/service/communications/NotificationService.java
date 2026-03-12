package com.minexpert.hns.service.communications;

import com.minexpert.hns.dto.communications.NotificationDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.projection.NotificationSummaryView;
import java.util.List;

public interface NotificationService {
    NotificationDTO create(NotificationDTO dto) throws HSException;

    NotificationDTO update(NotificationDTO dto) throws HSException;

    NotificationDTO getById(Long id) throws HSException;

    List<NotificationSummaryView> getAll() throws HSException;

    List<NotificationDTO> getActive() throws HSException;

    List<NotificationDTO> getExpired() throws HSException;

    List<NotificationDTO> getByCommunicationId(Long communicationId) throws HSException;
}
