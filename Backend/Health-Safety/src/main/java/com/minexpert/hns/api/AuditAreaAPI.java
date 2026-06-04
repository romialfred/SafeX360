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
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<Long> addAuditArea(@RequestParam Long companyId, @RequestBody AuditAreasDTO auditAreaDTO)
            throws HSException {
        return new ResponseEntity<>(auditAreaService.addAuditArea(companyId, auditAreaDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateAuditArea(@RequestParam Long companyId,
            @RequestBody AuditAreasDTO auditAreaDTO) throws HSException {
        auditAreaService.updateAuditArea(companyId, auditAreaDTO);
        return new ResponseEntity<>(new ResponseDTO("Audit Area updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteAuditArea(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        auditAreaService.deleteAuditArea(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Audit Area deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<AuditAreasDTO> getAuditAreaById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(auditAreaService.getAuditAreaById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AuditAreasDTO>> getAllAuditAreas(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(auditAreaService.getAllAuditAreas(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<AuditAreasDTO>> getAllActiveAuditAreas(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(auditAreaService.getAllActiveAuditAreas(companyId), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateAuditArea(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        auditAreaService.activateAuditArea(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Audit Area activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateAuditArea(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        auditAreaService.deactivateAuditArea(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Audit Area deactivated."), HttpStatus.OK);
    }
}
