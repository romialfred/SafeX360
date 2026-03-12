package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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
    public void deletePayrollSchedule(Long id) {
        payrollScheduleRepository.deleteById(id);
    }

    @Override
    public PayrollScheduleDTO getPayrollScheduleById(Long id) throws HRMSException {
        return payrollScheduleRepository.findById(id).orElseThrow(() -> new HRMSException("PAYROLL_SCHEDULE_NOT_FOUND"))
                .toDTO();
    }

    @Override
    public List<Integer> getPayrollYears() throws HRMSException {
        return payrollScheduleRepository.findDistinctYears();
    }

    @Override
    public List<PayrollScheduleDTO> getAllPayrollSchedulesByYear(int year) throws HRMSException {
        return payrollScheduleRepository.findByYear(year).stream().map(PayrollSchedule::toDTO).toList();
    }

    @Override
    public Object getMonthEnd(LocalDate date) throws HRMSException {
        return payrollScheduleRepository.findMonthEnd(date);
    }

    @Override
    public PayrollScheduleDTO getPayrollScheduleByMonth(LocalDate month) throws HRMSException {
        return payrollScheduleRepository.findByMonth(month)
                .orElseThrow(() -> new HRMSException("PAYROLL_SCHEDULE_NOT_FOUND")).toDTO();
    }

}
