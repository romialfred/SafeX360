package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    @Caching(evict = {
            @CacheEvict(cacheNames = "payrollDetailsAll", allEntries = true),
            @CacheEvict(cacheNames = "payrollDetailsByMonth", key = "#payrollTimesheets.month", condition = "#payrollTimesheets.month != null"),
            @CacheEvict(cacheNames = "payrollDistinctMonths", allEntries = true)
    })
    public void createPayrollEntries(PayrollTimesheets payrollTimesheets) throws HRMSException {
        payrollRepository.saveAll(payrollTimesheets.getPayrolls().stream().map(PayrollDTO::toEntity).toList());
        timesheetService.payTimesheets(payrollTimesheets.getTimesheets());

    }

    @Override
    @Cacheable(cacheNames = "payrollDetailsAll")
    public List<PayrollDetails> getAllPayrollDetails() throws HRMSException {
        return payrollRepository.getAllPayrollDetails();
    }

    @Override
    @Cacheable(cacheNames = "payrollDetailsByMonth", key = "#month")
    public List<PayrollDetails> getAllPayrollDetailsByMonth(LocalDate month) throws HRMSException {
        return payrollRepository.getAllPayrollDetailsByMonth(month);
    }

    @Override
    @Cacheable(cacheNames = "payrollDistinctMonths")
    public List<LocalDate> findDistinctMonths() throws HRMSException {
        return payrollRepository.findDistinctMonths();
    }

}
