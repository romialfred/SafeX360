package com.minexpert.hns.service.communications;

import com.minexpert.hns.dto.communications.NotificationDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.projection.NotificationSummaryView;

import java.util.List;

/**
 * Service des notifications (comptes-rendus d'envoi), cloisonne par mine via la
 * Communication parente (companyId). companyId null = pas de cloisonnement
 * (appel systeme / allMines).
 */
public interface NotificationService {
    NotificationDTO create(NotificationDTO dto, Long companyId) throws HSException;

    NotificationDTO update(NotificationDTO dto, Long companyId) throws HSException;

    NotificationDTO getById(Long id, Long companyId) throws HSException;

    List<NotificationSummaryView> getAll(Long companyId) throws HSException;

    List<NotificationDTO> getActive(Long companyId) throws HSException;

    List<NotificationDTO> getExpired(Long companyId) throws HSException;

    List<NotificationDTO> getByCommunicationId(Long communicationId, Long companyId)
            throws HSException;
}
