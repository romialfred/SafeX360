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
import com.minexpert.hns.dto.parameters.WorkProcessDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.WorkProcessService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/work-process")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class WorkProcessAPI {
    private final WorkProcessService workProcessService;

    @PostMapping("/create")
    public ResponseEntity<Long> addWorkProcess(@RequestParam Long companyId, @RequestBody WorkProcessDTO workProcessDTO)
            throws HSException {
        return new ResponseEntity<>(workProcessService.addWorkProcess(companyId, workProcessDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWorkProcess(@RequestParam(required = false) Long companyId,
            @RequestBody WorkProcessDTO workProcessDTO)
            throws HSException {
        workProcessService.updateWorkProcess(companyId, workProcessDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Process updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteWorkProcess(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        workProcessService.deleteWorkProcess(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Work Process deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WorkProcessDTO> getWorkProcessById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(workProcessService.getWorkProcessById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WorkProcessDTO>> getAllWorkProcess(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(workProcessService.getAllWorkProcess(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<WorkProcessDTO>> getAllActiveWorkProcess(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(workProcessService.getAllActiveWorkProcess(companyId), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateWorkProcess(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        workProcessService.activateWorkProcess(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Work Process activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateWorkProcess(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        workProcessService.deactivateWorkProcess(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Work Process deactivated."), HttpStatus.OK);
    }

}