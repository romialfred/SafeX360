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

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.parameters.IncidentTypeDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.IncidentTypeService;

@RestController
@RequestMapping("/incidents-type")
@CrossOrigin
@Validated
public class IncidentTypeAPI {

    @Autowired
    private IncidentTypeService incidentTypeService;

    @PostMapping("/create")
    public ResponseEntity<Long> createIncidentType(@RequestParam Long companyId,
            @RequestBody IncidentTypeDTO incidentTypeDTO) throws HSException {
        return new ResponseEntity<>(incidentTypeService.addIncidentType(companyId, incidentTypeDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncidentType(@RequestParam(required = false) Long companyId,
            @RequestBody IncidentTypeDTO incidentTypeDTO) throws HSException {
        incidentTypeService.updateIncidentType(companyId, incidentTypeDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident Type Updated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentTypeDTO> getIncidentTypeById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentTypeService.getIncidentTypeById(companyId, id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateIncidentType(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        incidentTypeService.activateIncidentType(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Type Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateIncidentType(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        incidentTypeService.deactivateIncidentType(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Type Deactivated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentTypeDetails>> getAllIncidentTypes(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(incidentTypeService.getAllIncidentTypes(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<IncidentTypeDetails>> getAllActiveIncidentTypes(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(incidentTypeService.getAllActiveIncidentTypes(companyId), HttpStatus.OK);
    }

    @GetMapping("/countBySeverityLevel")
    public ResponseEntity<List<CategorySeverityCount>> countIncidentTypesBySeverityLevel(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(incidentTypeService.countIncidentTypesBySeverityLevel(companyId), HttpStatus.OK);
    }

    @GetMapping("/countByCategory")
    public ResponseEntity<List<CategorySeverityCount>> countIncidentTypesByCategory(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(incidentTypeService.countIncidentTypesByCategory(companyId), HttpStatus.OK);
    }

    @GetMapping("/countByCategoryAndSeverityLevel")
    public ResponseEntity<List<CategorySeverityCount>> countByCategoryAndSeverityLevel(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(incidentTypeService.countByCategoryAndSeverityLevel(companyId), HttpStatus.OK);
    }

}
