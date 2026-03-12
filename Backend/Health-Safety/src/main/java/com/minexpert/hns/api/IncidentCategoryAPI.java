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
    public ResponseEntity<Long> createIncidentCategory(@RequestBody IncidentCategoryDTO incidentCategoryDTO)
            throws HSException {
        return new ResponseEntity<>(incidentCategoryService.addIncidentCategory(incidentCategoryDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncidentCategory(@RequestBody IncidentCategoryDTO incidentCategoryDTO)
            throws HSException {
        incidentCategoryService.updateIncidentCategory(incidentCategoryDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident Updated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentCategoryDTO> getIncidentCategoryById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentCategoryService.getIncidentCategoryById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentCategoryDTO>> getAllIncidentCategories() throws HSException {
        return new ResponseEntity<>(incidentCategoryService.getAllIncidentCategories(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<IncidentCategoryResponse>> getAllActiveIncidentCategories() throws HSException {
        return new ResponseEntity<>(incidentCategoryService.getAllActiveIncidentCategories(), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateIncidentCategory(@PathVariable Long id) throws HSException {
        incidentCategoryService.activateIncidentCategory(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Category Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateIncidentCategory(@PathVariable Long id) throws HSException {
        incidentCategoryService.deactivateIncidentCategory(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Category Deactivated Successfully"), HttpStatus.OK);
    }
}
