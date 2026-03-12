package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.EmployeeLeaveBalance;
import com.hrms.dto.EmployeeDTO;
import com.hrms.dto.LeaveBalanceDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.LeaveBalanceService;

@RestController
@CrossOrigin
@RequestMapping("/leave-balance")
@Validated
public class LeaveBalanceAPI {
    @Autowired
    private LeaveBalanceService leaveBalanceService;

    @PostMapping("/addAll")
    public ResponseEntity<ResponseDTO> addAllLeaveBalances(@RequestBody List<LeaveBalanceDTO> leaveBalanceDTOs) throws HRMSException {
        leaveBalanceService.addAllRecords(leaveBalanceDTOs);
        return new ResponseEntity<>(new ResponseDTO("All Records Added Successfully"), HttpStatus.OK);
    }
    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateLeaveBalance(@RequestBody LeaveBalanceDTO leaveBalanceDTO) throws HRMSException {
        leaveBalanceService.updateRecord(leaveBalanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Record Updated Successfully"), HttpStatus.OK);
    }
    @PostMapping("/deductLeave")
    public ResponseEntity<ResponseDTO> deductLeaveBalance(@RequestBody LeaveBalanceDTO leaveBalanceDTO) throws HRMSException {
        leaveBalanceService.deductLeaveBalance(leaveBalanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Leave Deudcted Successfully"), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<LeaveBalanceDTO>> getAllLeaveBalances() throws HRMSException {
        return new ResponseEntity<>(leaveBalanceService.getAllRecords(), HttpStatus.OK);
    }
    @GetMapping("/getLeaveBalance/{empNumber}")
    public ResponseEntity<LeaveBalanceDTO> getLeaveBalance(@PathVariable String empNumber) throws HRMSException {
        return new ResponseEntity<>(leaveBalanceService.getLatestLeaveBalance(empNumber), HttpStatus.OK);
    }
    @PostMapping("/checkEntry")
    public ResponseEntity<EmployeeLeaveBalance> checkEntry(@RequestBody LeaveBalanceDTO leaveBalanceDTO) throws HRMSException {
        return new ResponseEntity<>(leaveBalanceService.checkEmployeeLeaveBalance(leaveBalanceDTO), HttpStatus.OK);
    }

}
