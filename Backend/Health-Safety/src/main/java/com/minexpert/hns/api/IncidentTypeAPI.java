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
    public ResponseEntity<Long> createIncidentType(@RequestBody IncidentTypeDTO incidentTypeDTO) throws HSException {
        return new ResponseEntity<>(incidentTypeService.addIncidentType(incidentTypeDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateIncidentType(@RequestBody IncidentTypeDTO incidentTypeDTO) throws HSException {
        incidentTypeService.updateIncidentType(incidentTypeDTO);
        return new ResponseEntity<>("Incident Type Updated Successfully", HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentTypeDTO> getIncidentTypeById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentTypeService.getIncidentTypeById(id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activateIncidentType(@PathVariable Long id) throws HSException {
        incidentTypeService.activateIncidentType(id);
        return new ResponseEntity<>("Incident Type Activated Successfully", HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateIncidentType(@PathVariable Long id) throws HSException {
        incidentTypeService.deactivateIncidentType(id);
        return new ResponseEntity<>("Incident Type Deactivated Successfully", HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentTypeDetails>> getAllIncidentTypes() throws HSException {
        return new ResponseEntity<>(incidentTypeService.getAllIncidentTypes(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<IncidentTypeDetails>> getAllActiveIncidentTypes() throws HSException {
        return new ResponseEntity<>(incidentTypeService.getAllActiveIncidentTypes(), HttpStatus.OK);
    }

    @GetMapping("/countBySeverityLevel")
    public ResponseEntity<List<CategorySeverityCount>> countIncidentTypesBySeverityLevel() throws HSException {
        return new ResponseEntity<>(incidentTypeService.countIncidentTypesBySeverityLevel(), HttpStatus.OK);
    }

    @GetMapping("/countByCategory")
    public ResponseEntity<List<CategorySeverityCount>> countIncidentTypesByCategory() throws HSException {
        return new ResponseEntity<>(incidentTypeService.countIncidentTypesByCategory(), HttpStatus.OK);
    }

    @GetMapping("/countByCategoryAndSeverityLevel")
    public ResponseEntity<List<CategorySeverityCount>> countByCategoryAndSeverityLevel() throws HSException {
        return new ResponseEntity<>(incidentTypeService.countByCategoryAndSeverityLevel(), HttpStatus.OK);
    }

}
