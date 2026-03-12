package com.hrms.api.Timesheet;

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

import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.ConstraintsDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.ConstraintsService;

@RestController
@RequestMapping("/constraints")
@CrossOrigin
@Validated
public class ConstraintsAPI {

    @Autowired
    private ConstraintsService constraintsService;

    @PostMapping("/add-flag")
    public ResponseEntity<ResponseDTO> addFlag(@RequestBody String flag) throws HRMSException {
        constraintsService.addFlag(flag);
        return new ResponseEntity<>(new ResponseDTO("Flag added successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/activate-flag")
    public ResponseEntity<ResponseDTO> activateFlag(@RequestBody String flag) throws HRMSException {
        constraintsService.activateFlag(flag);
        return new ResponseEntity<>(new ResponseDTO("Flag activated successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate-flag")
    public ResponseEntity<ResponseDTO> deactivateFlag(@RequestBody String flag) throws HRMSException {
        constraintsService.deactivateFlag(flag);
        return new ResponseEntity<>(new ResponseDTO("Flag deactivated successfully"), HttpStatus.OK);
    }

    @GetMapping("/get-flag/{flag}")
    public ResponseEntity<ConstraintsDTO> getFlag(@PathVariable String flag) throws HRMSException {
        return new ResponseEntity<>(constraintsService.getFlag(flag), HttpStatus.OK);
    }

    @GetMapping("/get-all-flags")
    public ResponseEntity<List<ConstraintsDTO>> getAllFlags() throws HRMSException {
        return new ResponseEntity<>(constraintsService.getAllFlags(), HttpStatus.OK);
    }

    @GetMapping("/is-flag-active/{flag}")
    public ResponseEntity<Boolean> isFlagActive(@PathVariable String flag) throws HRMSException {
        return new ResponseEntity<>(constraintsService.isFlagActive(flag), HttpStatus.OK);
    }

}
