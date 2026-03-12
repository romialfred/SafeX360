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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.LeaveDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.LeaveService;

@RestController
@CrossOrigin
@RequestMapping("/leave")
@Validated
public class LeaveAPI {
    @Autowired
    private LeaveService leaveService;

    @PostMapping("/add")
    public ResponseEntity<Long> addLeave(@RequestBody LeaveDTO leaveDTO) throws HRMSException {
        return new ResponseEntity<>(leaveService.addLeave(leaveDTO), HttpStatus.CREATED);
    }
 @GetMapping("/get/{id}")
    public ResponseEntity<LeaveDTO> getLeave(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(leaveService.getLeave(id), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<LeaveDTO>> getAllLeaves() {
        return new ResponseEntity<>(leaveService.getAllLeaves(), HttpStatus.OK);
    }
    @GetMapping("/getAll/{empId}")
    public ResponseEntity<List<LeaveDTO>> getAllLeavesByEmpId(@PathVariable Long empId) {
        return new ResponseEntity<>(leaveService.getAllLeavesByEmpId(empId), HttpStatus.OK);
    }
    @GetMapping("/getAllLeaves/{approverId}")
    public ResponseEntity<List<LeaveDTO>> getAllLeavesByApproverId(@PathVariable Long approverId) {
        return new ResponseEntity<>(leaveService.getAllLeavesByApproverId(approverId), HttpStatus.OK);
    }
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateLeave(@RequestBody LeaveDTO leaveDTO) throws Exception {
        leaveService.updateLeave(leaveDTO);
        return new ResponseEntity<>(new ResponseDTO("Leave updated Successfully."), HttpStatus.OK);
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteLeave(@PathVariable Long id) throws HRMSException {
        leaveService.deleteLeave(id);
        return new ResponseEntity<>(new ResponseDTO("Leave deleted Successfully."), HttpStatus.OK);
    }
     @GetMapping("/next/{empId}")
    public ResponseEntity<LeaveDTO> getNextLeave(@PathVariable Long empId) throws HRMSException  {
        LeaveDTO nextLeave = leaveService.getNextLeave(empId);
        return new ResponseEntity<>(nextLeave, HttpStatus.OK);
    }
     @GetMapping("/getLeavesCount/{empId}")
    public ResponseEntity<List<Object[]>> getLeavesCount(@PathVariable Long empId) throws HRMSException  {
        return new ResponseEntity<>(leaveService.getLeaveDaysByType(empId), HttpStatus.OK);
    }
     @GetMapping("/getLeaveSummary/{departmentId}")
    public ResponseEntity<List<Object[]>> getLeaveSummary(@PathVariable Long departmentId) throws HRMSException  {
        return new ResponseEntity<>(leaveService.getLeaveSummary(departmentId), HttpStatus.OK);
    }
     @GetMapping("/getLeaveSummaryByStatus/{departmentId}")
    public ResponseEntity<List<Object[]>> getLeaveSummaryByStatus(@PathVariable Long departmentId) throws HRMSException  {
        return new ResponseEntity<>(leaveService.getLeaveSummaryByStatus(departmentId), HttpStatus.OK);
    }
     @GetMapping("/getAbsentCount/{departmentId}")
    public ResponseEntity<Long> getAbsentCount(@PathVariable Long departmentId) throws HRMSException  {
        return new ResponseEntity<>(leaveService.getAbsentCount(departmentId), HttpStatus.OK);
    }
     @GetMapping("/leaveCountByYear/{empId}")
    public ResponseEntity<Long> getLeaveCountByYear(@PathVariable Long empId) throws HRMSException  {
        return new ResponseEntity<>(leaveService.getLeaveCountForEmployee(empId), HttpStatus.OK);
    }
     @GetMapping("/countPendingRequest/{empId}")
    public ResponseEntity<Long> getPendingRequest(@PathVariable Long empId) throws HRMSException  {
        return new ResponseEntity<>(leaveService.getPendingLeaveCountForEmployee(empId), HttpStatus.OK);
    }
    
}
