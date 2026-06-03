package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.hrms.dto.Timesheet.PayrollScheduleDTO;
import com.hrms.entity.Timesheet.PayrollSchedule;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.PayrollScheduleRepository;

@Service
public class PayrollScheduleServiceImpl implements PayrollScheduleService {

    @Autowired
    private PayrollScheduleRepository payrollScheduleRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "payrollScheduleById", allEntries = true),
            @CacheEvict(cacheNames = "payrollSchedulesByYear", key = "#payrollScheduleDTO.month.year"),
            @CacheEvict(cacheNames = "payrollScheduleYears", allEntries = true),
            @CacheEvict(cacheNames = "payrollScheduleByMonth", key = "#payrollScheduleDTO.month"),
            @CacheEvict(cacheNames = "payrollMonthEnd", allEntries = true)
    })
    public PayrollScheduleDTO createPayrollSchedule(PayrollScheduleDTO payrollScheduleDTO) throws HRMSException {

        Optional<PayrollSchedule> existingSchedule = payrollScheduleRepository
                .findByMonth(payrollScheduleDTO.getMonth());
        if (existingSchedule.isPresent()) {
            throw new HRMSException("PAYROLL_SCHEDULE_ALREADY_EXISTS");
        }
        List<PayrollSchedule> overlappingSchedules = payrollScheduleRepository
                .findOverlappingPeriods(payrollScheduleDTO.getStartDate(), payrollScheduleDTO.getEndDate());
        if (!overlappingSchedules.isEmpty()) {
            throw new HRMSException("PAYROLL_SCHEDULE_OVERLAP");
        }
        return payrollScheduleRepository.save(payrollScheduleDTO.toEntity()).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "payrollScheduleById", key = "#payrollScheduleDTO.id", condition = "#payrollScheduleDTO.id != null"),
            @CacheEvict(cacheNames = "payrollSchedulesByYear", allEntries = true),
            @CacheEvict(cacheNames = "payrollScheduleYears", allEntries = true),
            @CacheEvict(cacheNames = "payrollScheduleByMonth", allEntries = true),
            @CacheEvict(cacheNames = "payrollMonthEnd", allEntries = true)
    })
    public void updatePayrollSchedule(PayrollScheduleDTO payrollScheduleDTO) throws HRMSException {
        PayrollSchedule existingSchedule = payrollScheduleRepository
                .findById(payrollScheduleDTO.getId())
                .orElseThrow(() -> new HRMSException("PAYROLL_SCHEDULE_NOT_FOUND"));
        if (!existingSchedule.getMonth().equals(payrollScheduleDTO.getMonth())) {
            Optional<PayrollSchedule> existingScheduleByMonth = payrollScheduleRepository
                    .findByMonth(payrollScheduleDTO.getMonth());
            if (existingScheduleByMonth.isPresent()) {
                throw new HRMSException("PAYROLL_SCHEDULE_ALREADY_EXISTS");
            }
        }
        List<PayrollSchedule> overlappingSchedules = payrollScheduleRepository
                .findOverlappingPeriods(payrollScheduleDTO.getStartDate(), payrollScheduleDTO.getEndDate());
        for (PayrollSchedule schedule : overlappingSchedules) {
            if (!schedule.getId().equals(payrollScheduleDTO.getId())) {
                throw new HRMSException("PAYROLL_SCHEDULE_OVERLAP");
            }
        }

        payrollScheduleRepository.save(payrollScheduleDTO.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "payrollScheduleById", key = "#id"),
            @CacheEvict(cacheNames = "payrollSchedulesByYear", allEntries = true),
            @CacheEvict(cacheNames = "payrollScheduleYears", allEntries = true),
            @CacheEvict(cacheNames = "payrollScheduleByMonth", allEntries = true),
            @CacheEvict(cacheNames = "payrollMonthEnd", allEntries = true)
    })
    public void deletePayrollSchedule(Long id) {
        payrollScheduleRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = "payrollScheduleById", key = "#id")
    public PayrollScheduleDTO getPayrollScheduleById(Long id) throws HRMSException {
        return payrollScheduleRepository.findById(id).orElseThrow(() -> new HRMSException("PAYROLL_SCHEDULE_NOT_FOUND"))
                .toDTO();
    }

    @Override
    @Cacheable(cacheNames = "payrollScheduleYears")
    public List<Integer> getPayrollYears() throws HRMSException {
        return payrollScheduleRepository.findDistinctYears();
    }

    @Override
    @Cacheable(cacheNames = "payrollSchedulesByYear", key = "#year")
    public List<PayrollScheduleDTO> getAllPayrollSchedulesByYear(int year) throws HRMSException {
        return payrollScheduleRepository.findByYear(year).stream().map(PayrollSchedule::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = "payrollMonthEnd", key = "#date")
    public Object getMonthEnd(LocalDate date) throws HRMSException {
        return payrollScheduleRepository.findMonthEnd(date);
    }

    @Override
    @Cacheable(cacheNames = "payrollScheduleByMonth", key = "#month")
    public PayrollScheduleDTO getPayrollScheduleByMonth(LocalDate month) throws HRMSException {
        return payrollScheduleRepository.findByMonth(month)
                .orElseThrow(() -> new HRMSException("PAYROLL_SCHEDULE_NOT_FOUND")).toDTO();
    }

}
