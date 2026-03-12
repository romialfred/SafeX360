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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.parameters.SeverityLevelDTO;
import com.minexpert.hns.dto.parameters.SeverityRequest;
import com.minexpert.hns.dto.response.SeverityLevelResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.SeverityLevelService;

@RestController
@RequestMapping("/severity-level")
@CrossOrigin
@Validated
public class SeverityLevelAPI {

    @Autowired
    private SeverityLevelService severityLevelService;

    @PostMapping("/create")
    public ResponseEntity<Long> createSeverityLevel(@RequestBody SeverityLevelDTO severityLevelDTO) throws HSException {
        return new ResponseEntity<>(severityLevelService.addSeverityLevel(severityLevelDTO), HttpStatus.CREATED);
    }

    @PostMapping("/createMultiple")
    public ResponseEntity<ResponseDTO> createMultipleSeverityLevels(@RequestBody SeverityRequest request)
            throws HSException {
        request.getCatDesc().forEach(catDesc -> {
            catDesc.setLevel(request.getLevel());
            catDesc.setName(request.getName());
            try {
                severityLevelService.addSeverityLevel(catDesc);
            } catch (HSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        });
        return new ResponseEntity<>(new ResponseDTO("Severity Levels Created Successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateSeverityLevel(@RequestBody SeverityLevelDTO severityLevelDTO)
            throws HSException {
        severityLevelService.updateSeverityLevel(severityLevelDTO);
        return new ResponseEntity<>("Severity Level Updated Successfully", HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<SeverityLevelDTO> getSeverityLevelById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(severityLevelService.getSeverityLevelById(id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activateSeverityLevel(@PathVariable Long id) throws HSException {
        severityLevelService.activateSeverityLevel(id);
        return new ResponseEntity<>("Severity Level Activated Successfully", HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateSeverityLevel(@PathVariable Long id) throws HSException {
        severityLevelService.deactivateSeverityLevel(id);
        return new ResponseEntity<>("Severity Level Deactivated Successfully", HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<SeverityLevelDTO>> getAllSeverityLevels() throws HSException {
        return new ResponseEntity<>(severityLevelService.getAllSeverityLevels(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<SeverityLevelResponse>> getAllActiveSeverityLevels() throws HSException {
        return new ResponseEntity<>(severityLevelService.getAllActiveSeverityLevels(), HttpStatus.OK);
    }

    @GetMapping("/getUniqueLevelName")
    public ResponseEntity<List<SeverityLevelResponse>> getUniqueLevelName() throws HSException {
        return new ResponseEntity<>(severityLevelService.getUniqueLevelName(), HttpStatus.OK);
    }

    @PostMapping("/addExample")
    public ResponseEntity<List<String>> addExample(@RequestBody SeverityLevelDTO request) throws HSException {
        return new ResponseEntity<>(severityLevelService.addExample(request), HttpStatus.OK);
    }

    @DeleteMapping("/deleteExample/{index}/{id}")
    public ResponseEntity<String> deleteExample(@PathVariable Long index, @PathVariable Long id)
            throws HSException {
        severityLevelService.deleteExample(index, id);
        return new ResponseEntity<>("Example deleted successfully", HttpStatus.OK);
    }
}
