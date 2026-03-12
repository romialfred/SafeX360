package com.hrms.api.Timesheet;

import java.time.LocalDate;
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

import com.hrms.DataInterface.PayrollDetails;
import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.PayrollTimesheets;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.PayrollService;

@RestController
@RequestMapping("/payroll")
@CrossOrigin
@Validated
public class PayrollAPI {
    @Autowired
    private PayrollService payrollService;

    @PostMapping("/createAll")
    public ResponseEntity<ResponseDTO> createAllPayrolls(@RequestBody PayrollTimesheets payrollTimesheets)
            throws HRMSException {
        payrollService.createPayrollEntries(payrollTimesheets);
        return new ResponseEntity<>(new ResponseDTO("Payrolls created successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PayrollDetails>> getAllPayrolls() throws HRMSException {
        return new ResponseEntity<>(payrollService.getAllPayrollDetails(),
                HttpStatus.OK);
    }

    @GetMapping("/getByMonth/{month}")
    public ResponseEntity<List<PayrollDetails>> getAllPayrollsByMonth(@PathVariable LocalDate month)
            throws HRMSException {
        return new ResponseEntity<>(payrollService.getAllPayrollDetailsByMonth(month),
                HttpStatus.OK);
    }

    @GetMapping("/getMonths")
    public ResponseEntity<List<LocalDate>> getDistinctMonths() throws HRMSException {
        return new ResponseEntity<>(payrollService.findDistinctMonths(),
                HttpStatus.OK);
    }

}
