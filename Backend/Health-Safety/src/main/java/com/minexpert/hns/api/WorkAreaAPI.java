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
    public ResponseEntity<Long> addWorkArea(@RequestBody WorkAreaDTO workAreaDTO) throws HSException {
        return new ResponseEntity<>(workAreaService.addWorkArea(workAreaDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWorkArea(@RequestBody WorkAreaDTO workAreaDTO) throws HSException {
        workAreaService.updateWorkArea(workAreaDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Area updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteWorkArea(@PathVariable Long id) throws HSException {
        workAreaService.deleteWorkArea(id);
        return new ResponseEntity<>(new ResponseDTO("Work Area deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WorkAreaDTO> getWorkAreaById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(workAreaService.getWorkAreaById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WorkAreaDTO>> getAllWorkArea() throws HSException {
        return new ResponseEntity<>(workAreaService.getAllWorkArea(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<WorkAreaDTO>> getAllActiveWorkArea() throws HSException {
        return new ResponseEntity<>(workAreaService.getAllActiveWorkArea(), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateWorkArea(@PathVariable Long id) throws HSException {
        workAreaService.activateWorkArea(id);
        return new ResponseEntity<>(new ResponseDTO("Work Area activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateWorkArea(@PathVariable Long id) throws HSException {
        workAreaService.deactivateWorkArea(id);
        return new ResponseEntity<>(new ResponseDTO("Work Area deactivated."), HttpStatus.OK);
    }

}