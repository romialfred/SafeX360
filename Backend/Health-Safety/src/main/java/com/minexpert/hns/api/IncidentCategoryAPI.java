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
import com.minexpert.hns.dto.parameters.IncidentCategoryDTO;
import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.IncidentCategoryService;

@RestController
@RequestMapping("/incidents-category")
@CrossOrigin
@Validated
public class IncidentCategoryAPI {
    @Autowired
    private IncidentCategoryService incidentCategoryService;

    @PostMapping("/create")
    public ResponseEntity<Long> createIncidentCategory(@RequestParam Long companyId,
            @RequestBody IncidentCategoryDTO incidentCategoryDTO)
            throws HSException {
        return new ResponseEntity<>(incidentCategoryService.addIncidentCategory(companyId, incidentCategoryDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncidentCategory(@RequestParam Long companyId,
            @RequestBody IncidentCategoryDTO incidentCategoryDTO)
            throws HSException {
        incidentCategoryService.updateIncidentCategory(companyId, incidentCategoryDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident Updated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentCategoryDTO> getIncidentCategoryById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentCategoryService.getIncidentCategoryById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentCategoryDTO>> getAllIncidentCategories(
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(incidentCategoryService.getAllIncidentCategories(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<IncidentCategoryResponse>> getAllActiveIncidentCategories(
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(incidentCategoryService.getAllActiveIncidentCategories(companyId), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateIncidentCategory(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        incidentCategoryService.activateIncidentCategory(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Category Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateIncidentCategory(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        incidentCategoryService.deactivateIncidentCategory(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Category Deactivated Successfully"), HttpStatus.OK);
    }
}
