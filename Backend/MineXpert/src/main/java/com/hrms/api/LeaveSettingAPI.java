package com.hrms.api;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.LeaveSettingDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.LeaveSettingService;

@RestController
@CrossOrigin
@RequestMapping("/leave-setting")
@Validated
public class LeaveSettingAPI {
    @Autowired
    private LeaveSettingService leaveSettingService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addLeaveSetting(@RequestBody LeaveSettingDTO leaveSettingDTO)
            throws HRMSException {
        leaveSettingService.addLeaveSetting(leaveSettingDTO);
        return new ResponseEntity<>(new ResponseDTO("Leave Setting added Successfully."), HttpStatus.CREATED);
    }

    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateLeaveSetting(@RequestBody LeaveSettingDTO leaveSettingDTO)
            throws HRMSException {
        leaveSettingService.updateLeaveSetting(leaveSettingDTO);
        return new ResponseEntity<>(new ResponseDTO("Leave Setting Updated Successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<LeaveSettingDTO> getLeaveSetting(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(leaveSettingService.getLeaveSetting(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<LeaveSettingDTO>> getAllLeaveSettings() {
        return new ResponseEntity<>(leaveSettingService.getAllLeaveSettings(), HttpStatus.OK);
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<LeaveSettingDTO>> getActiveLeaveSettings() {
        return new ResponseEntity<>(leaveSettingService.getActiveLeaveSettings(), HttpStatus.OK);
    }

}
