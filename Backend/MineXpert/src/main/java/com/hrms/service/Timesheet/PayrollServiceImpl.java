package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.PayrollDetails;
import com.hrms.dto.Timesheet.PayrollDTO;
import com.hrms.dto.Timesheet.PayrollTimesheets;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.PayrollRepository;

@Service
public class PayrollServiceImpl implements PayrollService {

    @Autowired
    private PayrollRepository payrollRepository;
    @Autowired
    private TimesheetService timesheetService;

    @Override
    public void createPayrollEntries(PayrollTimesheets payrollTimesheets) throws HRMSException {
        payrollRepository.saveAll(payrollTimesheets.getPayrolls().stream().map(PayrollDTO::toEntity).toList());
        timesheetService.payTimesheets(payrollTimesheets.getTimesheets());

    }

    @Override
    public List<PayrollDetails> getAllPayrollDetails() throws HRMSException {
        return payrollRepository.getAllPayrollDetails();
    }

    @Override
    public List<PayrollDetails> getAllPayrollDetailsByMonth(LocalDate month) throws HRMSException {
        return payrollRepository.getAllPayrollDetailsByMonth(month);
    }

    @Override
    public List<LocalDate> findDistinctMonths() throws HRMSException {
        return payrollRepository.findDistinctMonths();
    }

}
