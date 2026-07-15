package com.minexpert.hns.service.inspections;

import java.util.List;

import com.minexpert.hns.dto.inspections.InspectionInterviewsDTO;
import com.minexpert.hns.exception.HSException;

public interface InspectionInterviewService {

    Long createInterview(InspectionInterviewsDTO interviewDTO) throws HSException;

    InspectionInterviewsDTO getInterviewById(Long id) throws HSException;

    void updateInterview(InspectionInterviewsDTO interviewDTO) throws HSException;

    void deleteInterview(Long id) throws HSException;

    List<InspectionInterviewsDTO> getAllInterviews() throws HSException;

    InspectionInterviewsDTO getInterviewsByInspectionId(Long inspectionId, Long companyId) throws HSException;
}
