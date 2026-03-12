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
    public ResponseEntity<Long> addWorkProcess(@RequestBody WorkProcessDTO workProcessDTO) throws HSException {
        return new ResponseEntity<>(workProcessService.addWorkProcess(workProcessDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWorkProcess(@RequestBody WorkProcessDTO workProcessDTO)
            throws HSException {
        workProcessService.updateWorkProcess(workProcessDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Process updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteWorkProcess(@PathVariable Long id) throws HSException {
        workProcessService.deleteWorkProcess(id);
        return new ResponseEntity<>(new ResponseDTO("Work Process deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WorkProcessDTO> getWorkProcessById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(workProcessService.getWorkProcessById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WorkProcessDTO>> getAllWorkProcess() throws HSException {
        return new ResponseEntity<>(workProcessService.getAllWorkProcess(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<WorkProcessDTO>> getAllActiveWorkProcess() throws HSException {
        return new ResponseEntity<>(workProcessService.getAllActiveWorkProcess(), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateWorkProcess(@PathVariable Long id) throws HSException {
        workProcessService.activateWorkProcess(id);
        return new ResponseEntity<>(new ResponseDTO("Work Process activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateWorkProcess(@PathVariable Long id) throws HSException {
        workProcessService.deactivateWorkProcess(id);
        return new ResponseEntity<>(new ResponseDTO("Work Process deactivated."), HttpStatus.OK);
    }

}