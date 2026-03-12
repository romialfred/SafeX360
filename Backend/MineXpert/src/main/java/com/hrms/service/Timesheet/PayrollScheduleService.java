package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import com.hrms.dto.Timesheet.PayrollScheduleDTO;
import com.hrms.exception.HRMSException;

public interface PayrollScheduleService {
    public PayrollScheduleDTO createPayrollSchedule(PayrollScheduleDTO payrollScheduleDTO) throws HRMSException;

    public void updatePayrollSchedule(PayrollScheduleDTO payrollScheduleDTO) throws HRMSException;

    public void deletePayrollSchedule(Long id) throws HRMSException;

    public PayrollScheduleDTO getPayrollScheduleById(Long id) throws HRMSException;

    public List<Integer> getPayrollYears() throws HRMSException;

    public List<PayrollScheduleDTO> getAllPayrollSchedulesByYear(int year) throws HRMSException;

    public Object getMonthEnd(LocalDate date) throws HRMSException;

    public PayrollScheduleDTO getPayrollScheduleByMonth(LocalDate month) throws HRMSException;
}
