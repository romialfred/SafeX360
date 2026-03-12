package com.minexpert.hns.api;

import java.util.List;

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
import com.minexpert.hns.dto.parameters.AuditAreasDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.AuditAreasService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/audit-area")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class AuditAreaAPI {

    private final AuditAreasService auditAreaService;

    @PostMapping("/create")
    public ResponseEntity<Long> addAuditArea(@RequestBody AuditAreasDTO auditAreaDTO) throws HSException {
        return new ResponseEntity<>(auditAreaService.addAuditArea(auditAreaDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateAuditArea(@RequestBody AuditAreasDTO auditAreaDTO) throws HSException {
        auditAreaService.updateAuditArea(auditAreaDTO);
        return new ResponseEntity<>(new ResponseDTO("Audit Area updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteAuditArea(@PathVariable Long id) throws HSException {
        auditAreaService.deleteAuditArea(id);
        return new ResponseEntity<>(new ResponseDTO("Audit Area deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<AuditAreasDTO> getAuditAreaById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(auditAreaService.getAuditAreaById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AuditAreasDTO>> getAllAuditAreas() throws HSException {
        return new ResponseEntity<>(auditAreaService.getAllAuditAreas(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<AuditAreasDTO>> getAllActiveAuditAreas() throws HSException {
        return new ResponseEntity<>(auditAreaService.getAllActiveAuditAreas(), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateAuditArea(@PathVariable Long id) throws HSException {
        auditAreaService.activateAuditArea(id);
        return new ResponseEntity<>(new ResponseDTO("Audit Area activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateAuditArea(@PathVariable Long id) throws HSException {
        auditAreaService.deactivateAuditArea(id);
        return new ResponseEntity<>(new ResponseDTO("Audit Area deactivated."), HttpStatus.OK);
    }
}
