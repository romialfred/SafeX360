package com.minexpert.hns.service.communications;

import com.minexpert.hns.dto.communications.CommTimeDTO;
import com.minexpert.hns.dto.communications.CommunicationDTO;
import com.minexpert.hns.dto.communications.CommunicationStatsDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.projection.CommunicationSummaryView;

import java.util.List;

public interface CommunicationService {
    CommunicationDTO create(CommunicationDTO dto) throws HSException;

    CommunicationDTO update(CommunicationDTO dto) throws HSException;

    CommunicationDTO getById(Long id) throws HSException;

    List<CommunicationSummaryView> getAll() throws HSException;

    List<CommunicationSummaryView> getRecentSummaries(int limit) throws HSException;

    List<CommunicationDTO> getByDepartmentId(Long departmentId) throws HSException;

    CommunicationStatsDTO getCounts() throws HSException;

    CommunicationDTO resumeSchedule(Long communicationId) throws HSException;

    CommunicationDTO pauseSchedule(Long communicationId) throws HSException;

    CommunicationDTO cancelSchedule(Long communicationId) throws HSException;

    CommTimeDTO sendNow(Long communicationId) throws HSException;
}
