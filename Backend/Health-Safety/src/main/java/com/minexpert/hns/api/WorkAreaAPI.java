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
import com.minexpert.hns.dto.parameters.WorkAreaDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.WorkAreaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/work-area")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class WorkAreaAPI {
    private final WorkAreaService workAreaService;

    @PostMapping("/create")
    public ResponseEntity<Long> addWorkArea(@RequestParam Long companyId, @RequestBody WorkAreaDTO workAreaDTO)
            throws HSException {
        return new ResponseEntity<>(workAreaService.addWorkArea(companyId, workAreaDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWorkArea(@RequestParam Long companyId,
            @RequestBody WorkAreaDTO workAreaDTO) throws HSException {
        workAreaService.updateWorkArea(companyId, workAreaDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Area updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteWorkArea(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        workAreaService.deleteWorkArea(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Work Area deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WorkAreaDTO> getWorkAreaById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(workAreaService.getWorkAreaById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WorkAreaDTO>> getAllWorkArea(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(workAreaService.getAllWorkArea(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<WorkAreaDTO>> getAllActiveWorkArea(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(workAreaService.getAllActiveWorkArea(companyId), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateWorkArea(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        workAreaService.activateWorkArea(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Work Area activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateWorkArea(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        workAreaService.deactivateWorkArea(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Work Area deactivated."), HttpStatus.OK);
    }

}