package com.hrms.api.Timesheet;

import java.time.LocalDate;
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

import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.PayrollScheduleDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.PayrollScheduleService;

@RestController
@RequestMapping("/payroll-schedule")
@CrossOrigin
@Validated
public class PayrollScheduleAPI {
    @Autowired
    private PayrollScheduleService payrollScheduleService;

    @PostMapping("/create")
    public ResponseEntity<PayrollScheduleDTO> createPayrollSchedule(@RequestBody PayrollScheduleDTO payrollScheduleDTO)
            throws HRMSException {

        return new ResponseEntity<>(payrollScheduleService.createPayrollSchedule(payrollScheduleDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updatePayrollSchedule(@RequestBody PayrollScheduleDTO payrollScheduleDTO)
            throws HRMSException {
        payrollScheduleService.updatePayrollSchedule(payrollScheduleDTO);
        return new ResponseEntity<>(new ResponseDTO("Payroll schedule updated successfully"), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deletePayrollSchedule(@PathVariable Long id) throws HRMSException {
        payrollScheduleService.deletePayrollSchedule(id);
        return new ResponseEntity<>(new ResponseDTO("Payroll schedule deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PayrollScheduleDTO> getPayrollScheduleById(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(payrollScheduleService.getPayrollScheduleById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll/{year}")
    public ResponseEntity<List<PayrollScheduleDTO>> getAllPayrollSchedules(@PathVariable int year)
            throws HRMSException {
        return new ResponseEntity<>(payrollScheduleService.getAllPayrollSchedulesByYear(year),
                HttpStatus.OK);
    }

    @GetMapping("/getYears")
    public ResponseEntity<List<Integer>> getPayrollYears() throws HRMSException {
        return new ResponseEntity<>(payrollScheduleService.getPayrollYears(), HttpStatus.OK);
    }

    @GetMapping("/getMonthEnd/{date}")
    public ResponseEntity<Object> getMonthEnd(@PathVariable LocalDate date) throws HRMSException {
        return new ResponseEntity<>(payrollScheduleService.getMonthEnd(date), HttpStatus.OK);
    }

    @GetMapping("/getByMonth/{month}")
    public ResponseEntity<PayrollScheduleDTO> getPayrollScheduleByMonth(@PathVariable LocalDate month)
            throws HRMSException {
        return new ResponseEntity<>(payrollScheduleService.getPayrollScheduleByMonth(month), HttpStatus.OK);
    }
}
