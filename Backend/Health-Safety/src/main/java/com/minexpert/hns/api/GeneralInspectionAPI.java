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
            @RequestBody GeneralInspectionDTO generalInspectionDTO) throws HSException {
        generalInspectionService.createGeneralInspection(generalInspectionDTO);
        return new ResponseEntity<>(new ResponseDTO("General Inspection created successfully."), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateGeneralInspection(
            @RequestBody GeneralInspectionDTO generalInspectionDTO) throws HSException {
        generalInspectionService.updateGeneralInspection(generalInspectionDTO);
        return new ResponseEntity<>(new ResponseDTO("General Inspection updated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<GeneralInspectionResponse>> getAllInspections() throws HSException {
        List<GeneralInspectionResponse> inspections = generalInspectionService.getAllInspections();
        return new ResponseEntity<>(inspections, HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<GeneralInspectionDetails> getInspectionDetailsById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(generalInspectionService.getInspectionDetailsById(id), HttpStatus.OK);
    }

    @GetMapping("/getInfo/{id}")
    public ResponseEntity<InspectionInfo> getInspectionInfoById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(generalInspectionService.getInspectionInfoById(id), HttpStatus.OK);
    }

}
