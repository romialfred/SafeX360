package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.GeneralInspectionDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.inspections.GeneralInspectionService;

@RestController
@RequestMapping("/general-inspections")
@CrossOrigin
@Validated
public class GeneralInspectionAPI {

    @Autowired
    private GeneralInspectionService generalInspectionService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createGeneralInspection(
            @RequestParam(required = false) Long companyId,
            @RequestBody GeneralInspectionDTO generalInspectionDTO) throws HSException {
        // Mine active injectée en query par l'intercepteur Axios : on la persiste,
        // sinon l'inspection est créée avec companyId=null et devient invisible
        // dans le registre filtré par mine.
        if (companyId != null) {
            generalInspectionDTO.setCompanyId(companyId);
        }
        generalInspectionService.createGeneralInspection(generalInspectionDTO);
        return new ResponseEntity<>(new ResponseDTO("General Inspection created successfully."), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateGeneralInspection(
            @RequestParam(required = false) Long companyId,
            @RequestBody GeneralInspectionDTO generalInspectionDTO) throws HSException {
        if (companyId != null) {
            generalInspectionDTO.setCompanyId(companyId);
        }
        generalInspectionService.updateGeneralInspection(generalInspectionDTO, companyId);
        return new ResponseEntity<>(new ResponseDTO("General Inspection updated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<GeneralInspectionResponse>> getAllInspections(
            @RequestParam(required = false) Long companyId) throws HSException {
        List<GeneralInspectionResponse> inspections = generalInspectionService.getAllInspections(companyId);
        return new ResponseEntity<>(inspections, HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<GeneralInspectionDetails> getInspectionDetailsById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(generalInspectionService.getInspectionDetailsById(id, companyId), HttpStatus.OK);
    }

    @GetMapping("/getInfo/{id}")
    public ResponseEntity<InspectionInfo> getInspectionInfoById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(generalInspectionService.getInspectionInfoById(id, companyId), HttpStatus.OK);
    }

}
