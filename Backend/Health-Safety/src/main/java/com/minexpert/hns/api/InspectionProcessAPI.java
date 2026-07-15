package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.inspections.InspectionChecklistDTO;
import com.minexpert.hns.dto.inspections.InspectionMeasurementDTO;
import com.minexpert.hns.dto.inspections.ProcessDTO;
import com.minexpert.hns.dto.parameters.CheckListDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.service.inspections.InspectionChecklistService;
import com.minexpert.hns.service.inspections.InspectionMeasurementService;
import com.minexpert.hns.service.inspections.ProcessService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/inspection-process")
@CrossOrigin
@Validated
public class InspectionProcessAPI {
    @Autowired
    private ProcessService processService;

    @Autowired
    private InspectionChecklistService inspectionChecklistService;
    @Autowired
    private InspectionMeasurementService inspectionMeasurementService;

    @Autowired
    private GeneralInspectionRepository generalInspectionRepository;

    /**
     * Cloisonnement par mine : refuse toute écriture rattachée à une inspection
     * appartenant à une autre mine. companyId null = appel système / toutes mines.
     */
    private void assertInspectionCompany(Long inspectionId, Long companyId) throws HSException {
        if (companyId == null || inspectionId == null) {
            return;
        }
        Long owner = generalInspectionRepository.findById(inspectionId)
                .map(GeneralInspection::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("GENERAL_INSPECTION_NOT_FOUND");
        }
    }

    @PostMapping("/addChecklist")
    public ResponseEntity<Long> addChecklist(
            @RequestParam(required = false) Long companyId,
            @RequestBody InspectionChecklistDTO inspectionChecklistDTO)
            throws HSException {
        // Cloisonnement par mine : l'inspection parente (id du body) doit appartenir à la mine.
        assertInspectionCompany(inspectionChecklistDTO.getGeneralInspectionId(), companyId);
        if (companyId != null) {
            inspectionChecklistDTO.setCompanyId(companyId);
        }
        return new ResponseEntity<>(inspectionChecklistService.createChecklist(inspectionChecklistDTO),
                HttpStatus.CREATED);
    }

    @PostMapping("/addMeasurement")
    public ResponseEntity<Long> addMeasurements(
            @RequestParam(required = false) Long companyId,
            @RequestBody InspectionMeasurementDTO inspectionMeasurementDTO)
            throws HSException {
        // Cloisonnement par mine : l'inspection parente (id du body) doit appartenir à la mine.
        assertInspectionCompany(inspectionMeasurementDTO.getGeneralInspectionId(), companyId);
        if (companyId != null) {
            inspectionMeasurementDTO.setCompanyId(companyId);
        }
        return new ResponseEntity<>(inspectionMeasurementService.createMeasurement(inspectionMeasurementDTO),
                HttpStatus.OK);
    }

    @PostMapping("/save-draft")
    public ResponseEntity<ProcessDTO> saveDraft(
            @RequestParam(required = false) Long companyId,
            @RequestBody ProcessDTO processDTO) throws HSException {
        // Cloisonnement par mine : refuse d'écrire un brouillon (statut + sous-enregistrements)
        // sur une inspection appartenant à une autre mine.
        assertInspectionCompany(processDTO.getInspectionId(), companyId);
        if (companyId != null) {
            processDTO.setCompanyId(companyId);
        }
        return new ResponseEntity<>(processService.saveDraftProcess(processDTO), HttpStatus.CREATED);
    }

    @GetMapping("/get-draft/{id}")
    public ResponseEntity<ProcessDTO> getDraft(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(processService.getDraftProcess(id, companyId), HttpStatus.OK);
    }

    @DeleteMapping("/remove-checklist/{id}")
    public ResponseEntity<ResponseDTO> removeChecklist(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        inspectionChecklistService.deleteChecklist(id, companyId);
        return new ResponseEntity<>(new ResponseDTO("Checklist removed successfully"), HttpStatus.OK);
    }

    @DeleteMapping("/remove-measurement/{id}")
    public ResponseEntity<ResponseDTO> removeMeasurement(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        inspectionMeasurementService.deleteMeasurement(id, companyId);
        return new ResponseEntity<>(new ResponseDTO("Measurement removed successfully"), HttpStatus.OK);
    }

    @GetMapping("/getChecklists/{id}")
    public ResponseEntity<List<InspectionChecklistDTO>> getChecklists(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(inspectionChecklistService.getChecklistsByInspectionId(id, companyId),
                HttpStatus.OK);
    }

    @GetMapping("/getMeasurements/{id}")
    public ResponseEntity<List<InspectionMeasurementDTO>> getMeasurements(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(inspectionMeasurementService.getMeasurementByInspectionId(id, companyId),
                HttpStatus.OK);
    }

}
