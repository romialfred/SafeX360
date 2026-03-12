package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import com.hrms.DataInterface.PayrollDetails;
import com.hrms.dto.Timesheet.PayrollTimesheets;
import com.hrms.exception.HRMSException;

public interface PayrollService {
    public void createPayrollEntries(PayrollTimesheets payrollTimesheets) throws HRMSException;

    public List<PayrollDetails> getAllPayrollDetails() throws HRMSException;

    public List<PayrollDetails> getAllPayrollDetailsByMonth(LocalDate month) throws HRMSException;

    public List<LocalDate> findDistinctMonths() throws HRMSException;

}
