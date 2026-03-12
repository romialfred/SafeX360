package com.minexpert.hns.service.inspections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.inspections.InspectionInterviewsDTO;
import com.minexpert.hns.dto.inspections.ProcessDTO;
import com.minexpert.hns.exception.HSException;

@Service
public class ProcessServiceImpl implements ProcessService {

    @Autowired
    private InspectionChecklistService inspectionChecklistService;
    @Autowired
    private InspectionMeasurementService inspectionMeasurementService;
    @Autowired
    private InspectionInterviewService inspectionInterviewService;

    @Autowired
    private GeneralInspectionService generalInspectionService;

    @Override
    public ProcessDTO saveDraftProcess(ProcessDTO processDTO) throws HSException {
        processDTO.getChecklists().parallelStream().forEach(checklist -> {
            try {
                checklist.setId(inspectionChecklistService.createChecklist(checklist));
            } catch (HSException e) {
                System.out.println("Error creating checklist: " + e.getMessage());
            }
        });
        processDTO.getMeasurements().parallelStream().forEach(measurement -> {
            try {
                measurement.setId(inspectionMeasurementService.createMeasurement(measurement));
            } catch (HSException e) {
                System.out.println("Error creating measurement: " + e.getMessage());
            }
        });

        Long id = inspectionInterviewService.createInterview(processDTO.getInterviews());
        InspectionInterviewsDTO interview = processDTO.getInterviews();
        interview.setId(id);
        generalInspectionService.updateInspectionStatus(processDTO.getInspectionId(), processDTO.getStatus());
        return processDTO;
    }

    @Override
    public ProcessDTO getDraftProcess(Long id) throws HSException {
        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setInterviews(inspectionInterviewService.getInterviewsByInspectionId(id));
        processDTO.setChecklists(inspectionChecklistService.getChecklistsByInspectionId(id));
        processDTO.setMeasurements(inspectionMeasurementService.getMeasurementByInspectionId(id));
        return processDTO;
    }

}
