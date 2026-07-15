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
    @CacheEvict(cacheNames = "inspectionProcessDraft", allEntries = true)
    public ProcessDTO saveDraftProcess(ProcessDTO processDTO) throws HSException {
        // Cloisonnement : propager la mine active à chaque sous-enregistrement.
        final Long companyId = processDTO.getCompanyId();
        processDTO.getChecklists().parallelStream().forEach(checklist -> {
            try {
                if (companyId != null) {
                    checklist.setCompanyId(companyId);
                }
                checklist.setId(inspectionChecklistService.createChecklist(checklist));
            } catch (HSException e) {
                log.error("Error creating checklist: {}", e.getMessage());
            }
        });
        processDTO.getMeasurements().parallelStream().forEach(measurement -> {
            try {
                if (companyId != null) {
                    measurement.setCompanyId(companyId);
                }
                measurement.setId(inspectionMeasurementService.createMeasurement(measurement));
            } catch (HSException e) {
                log.error("Error creating measurement: {}", e.getMessage());
            }
        });

        InspectionInterviewsDTO interview = processDTO.getInterviews();
        if (interview != null && companyId != null) {
            interview.setCompanyId(companyId);
        }
        Long id = inspectionInterviewService.createInterview(interview);
        if (interview != null) {
            interview.setId(id);
        }
        generalInspectionService.updateInspectionStatus(processDTO.getInspectionId(), processDTO.getStatus());
        return processDTO;
    }

    @Override
    @Cacheable(cacheNames = "inspectionProcessDraft", key = "#id + '-' + #companyId")
    public ProcessDTO getDraftProcess(Long id, Long companyId) throws HSException {
        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setCompanyId(companyId);
        processDTO.setInterviews(inspectionInterviewService.getInterviewsByInspectionId(id, companyId));
        processDTO.setChecklists(inspectionChecklistService.getChecklistsByInspectionId(id, companyId));
        processDTO.setMeasurements(inspectionMeasurementService.getMeasurementByInspectionId(id, companyId));
        return processDTO;
    }

}
