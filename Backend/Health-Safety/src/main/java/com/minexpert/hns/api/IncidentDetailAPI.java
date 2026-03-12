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
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentDetailService;

@RestController
@RequestMapping("/incident-detail")
@CrossOrigin
@Validated
public class IncidentDetailAPI {

    @Autowired
    private IncidentDetailService incidentDetailService;

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteIncidentDetailById(@PathVariable Long id) throws HSException {
        incidentDetailService.deleteIncidentDetail(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Detail deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/severity-level-count")
    public ResponseEntity<List<CategorySeverityCount>> countIncidentDetailsBySeverityLevel() throws HSException {
        return new ResponseEntity<>(incidentDetailService.countIncidentDetailsBySeverityLevel(), HttpStatus.OK);
    }

    @GetMapping("/category-count")
    public ResponseEntity<List<CategorySeverityCount>> countIncidentDetailsByCategory() throws HSException {
        return new ResponseEntity<>(incidentDetailService.countIncidentDetailsByCategory(), HttpStatus.OK);
    }

    @GetMapping("/category-severity-count")
    public ResponseEntity<List<CategorySeverityCount>> countByCategoryAndSeverityLevel() throws HSException {
        return new ResponseEntity<>(incidentDetailService.countByCategoryAndSeverityLevel(), HttpStatus.OK);
    }
}
