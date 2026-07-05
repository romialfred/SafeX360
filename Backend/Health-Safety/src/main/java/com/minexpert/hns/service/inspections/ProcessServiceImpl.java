package com.minexpert.hns.service.inspections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.inspections.InspectionInterviewsDTO;
import com.minexpert.hns.dto.inspections.ProcessDTO;
import com.minexpert.hns.exception.HSException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class ProcessServiceImpl implements ProcessService {

    private static final Logger log = LoggerFactory.getLogger(ProcessServiceImpl.class);

    @Autowired
    private InspectionChecklistService inspectionChecklistService;
    @Autowired
    private InspectionMeasurementService inspectionMeasurementService;
    @Autowired
    private InspectionInterviewService inspectionInterviewService;

    @Autowired
    private GeneralInspectionService generalInspectionService;

    @Override
    @CacheEvict(cacheNames = "inspectionProcessDraft", key = "#processDTO.inspectionId", condition = "#processDTO.inspectionId != null")
    public ProcessDTO saveDraftProcess(ProcessDTO processDTO) throws HSException {
        processDTO.getChecklists().parallelStream().forEach(checklist -> {
            try {
                checklist.setId(inspectionChecklistService.createChecklist(checklist));
            } catch (HSException e) {
                log.error("Error creating checklist: {}", e.getMessage());
            }
        });
        processDTO.getMeasurements().parallelStream().forEach(measurement -> {
            try {
                measurement.setId(inspectionMeasurementService.createMeasurement(measurement));
            } catch (HSException e) {
                log.error("Error creating measurement: {}", e.getMessage());
            }
        });

        Long id = inspectionInterviewService.createInterview(processDTO.getInterviews());
        InspectionInterviewsDTO interview = processDTO.getInterviews();
        interview.setId(id);
        generalInspectionService.updateInspectionStatus(processDTO.getInspectionId(), processDTO.getStatus());
        return processDTO;
    }

    @Override
    @Cacheable(cacheNames = "inspectionProcessDraft", key = "#id")
    public ProcessDTO getDraftProcess(Long id) throws HSException {
        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setInterviews(inspectionInterviewService.getInterviewsByInspectionId(id));
        processDTO.setChecklists(inspectionChecklistService.getChecklistsByInspectionId(id));
        processDTO.setMeasurements(inspectionMeasurementService.getMeasurementByInspectionId(id));
        return processDTO;
    }

}
