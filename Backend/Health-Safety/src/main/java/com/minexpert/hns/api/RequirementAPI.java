package com.minexpert.hns.api;

import java.util.List;

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
import com.minexpert.hns.dto.compliance.RequirementDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.compliance.RequirementService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/compliance-requirement")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class RequirementAPI {
    private final RequirementService requirementService;

    @PostMapping("/create")
    public ResponseEntity<Long> createRequirement(
            @RequestBody RequirementDTO requirementDTO) throws HSException {
        return new ResponseEntity<>(requirementService.createRequirement(requirementDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateRequirement(@RequestBody RequirementDTO requirementDTO)
            throws HSException {
        requirementService.updateRequirement(requirementDTO);
        return new ResponseEntity<>(new ResponseDTO("Requirement Updated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateRequirement(@PathVariable Long id) throws HSException {
        requirementService.activateRequirement(id);
        return new ResponseEntity<>(new ResponseDTO("Requirement Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateRequirement(@PathVariable Long id) throws HSException {
        requirementService.deactivateRequirement(id);
        return new ResponseEntity<>(new ResponseDTO("Requirement Deactivated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<RequirementDTO> getRequirementById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(requirementService.getRequirementById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<RequirementDTO>> getAllRequirements() throws HSException {
        return new ResponseEntity<>(requirementService.getAllRequirements(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<RequirementDTO>> getAllActiveRequirements() throws HSException {
        return new ResponseEntity<>(requirementService.getAllActiveRequirements(), HttpStatus.OK);
    }

}
