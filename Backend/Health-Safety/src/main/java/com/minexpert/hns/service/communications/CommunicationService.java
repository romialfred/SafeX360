package com.minexpert.hns.service.communications;

import com.minexpert.hns.dto.communications.CommTimeDTO;
import com.minexpert.hns.dto.communications.CommunicationDTO;
import com.minexpert.hns.dto.communications.CommunicationStatsDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.projection.CommunicationSummaryView;

import java.util.List;

/**
 * Service Communications cloisonne par mine (companyId). Le param companyId
 * (valide par le CompanyScopeFilter) filtre les lectures et verifie
 * l'appartenance avant mutation. companyId null = pas de cloisonnement
 * (appel systeme / allMines).
 */
public interface CommunicationService {
    CommunicationDTO create(CommunicationDTO dto) throws HSException;

    CommunicationDTO update(CommunicationDTO dto, Long companyId) throws HSException;

    CommunicationDTO getById(Long id, Long companyId) throws HSException;

    List<CommunicationSummaryView> getAll(Long companyId) throws HSException;

    List<CommunicationSummaryView> getRecentSummaries(int limit, Long companyId) throws HSException;

    List<CommunicationDTO> getByDepartmentId(Long departmentId, Long companyId) throws HSException;

    CommunicationStatsDTO getCounts(Long companyId) throws HSException;

    CommunicationDTO resumeSchedule(Long communicationId, Long companyId) throws HSException;

    CommunicationDTO pauseSchedule(Long communicationId, Long companyId) throws HSException;

    CommunicationDTO cancelSchedule(Long communicationId, Long companyId) throws HSException;

    CommTimeDTO sendNow(Long communicationId, Long companyId) throws HSException;
}
