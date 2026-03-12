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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.ResponseDTO;
import com.hrms.dto.SalaryAdvanceDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.SalaryAdvanceService;

@RestController
@CrossOrigin
@RequestMapping("/salary-advance")
@Validated
public class SalaryAdvanceAPI {
    @Autowired
    private SalaryAdvanceService salaryAdvanceService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addSalaryAdvance(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws HRMSException {
        salaryAdvanceService.addSalaryAdvance(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Salary Advance added Successfully."),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateSalaryAdvance(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws HRMSException {
        salaryAdvanceService.updateSalaryAdvance(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Salary Advance Updated Successfully."),
                HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<SalaryAdvanceDTO> getSalaryAdvance(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(salaryAdvanceService.getSalaryAdvance(id), HttpStatus.OK);
    }

    @GetMapping("/getByEmpId/{empId}")
    public ResponseEntity<List<SalaryAdvanceDTO>> getSalaryAdvanceByEmpId(@PathVariable Long empId)
            throws HRMSException {
        return new ResponseEntity<>(salaryAdvanceService.getSalaryAdvanceByEmpId(empId), HttpStatus.OK);
    }

    @GetMapping("/getByApproverId/{approverId}")
    public ResponseEntity<List<SalaryAdvanceDTO>> getAllSalaryAdvancesByApproverId(@PathVariable Long approverId)
            throws HRMSException {
        return new ResponseEntity<>(salaryAdvanceService.getAllSalaryAdvancesByApproverId(approverId), HttpStatus.OK);
    }

    @PutMapping("/approve")
    public ResponseEntity<ResponseDTO> approveSalaryAdvance(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws Exception {
        salaryAdvanceService.approveSalaryAdvance(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Salary Advance Approved Successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/reject")
    public ResponseEntity<ResponseDTO> rejectSalaryAdvance(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws Exception {
        salaryAdvanceService.rejectSalaryAdvance(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Salary Advance Rejected Successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/complete-reimbursement")
    public ResponseEntity<ResponseDTO> completeReimbursement(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws Exception {
        salaryAdvanceService.completeReimbursement(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Reimbursement Completed Successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/first-payment")
    public ResponseEntity<ResponseDTO> firstPayment(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws Exception {
        salaryAdvanceService.firstPayment(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("First Payment Completed Successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/second-payment")
    public ResponseEntity<ResponseDTO> secondPayment(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws Exception {
        salaryAdvanceService.secondPayment(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Second Payment Completed Successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/third-payment")
    public ResponseEntity<ResponseDTO> thirdPayment(@RequestBody SalaryAdvanceDTO salaryAdvanceDTO)
            throws Exception {
        salaryAdvanceService.thirdPayment(salaryAdvanceDTO);
        return new ResponseEntity<>(new ResponseDTO("Third Payment Completed Successfully."),
                HttpStatus.OK);
    }
}
