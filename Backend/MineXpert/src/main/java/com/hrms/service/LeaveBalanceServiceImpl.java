package com.hrms.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.EmployeeLeaveBalance;
import com.hrms.dto.EmployeeDTO;
import com.hrms.dto.LeaveBalanceDTO;
import com.hrms.entity.LeaveBalance;
import com.hrms.exception.HRMSException;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveBalanceRepository;

@Service
public class LeaveBalanceServiceImpl implements LeaveBalanceService {
    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;
    @Autowired
    private EmployeeRepository employeeRepository;
    @Override
    public void addAllRecords(List<LeaveBalanceDTO> leaveBalanceDTOs) throws HRMSException {
        leaveBalanceRepository.saveAll(leaveBalanceDTOs.stream().map((x) -> {
            x.setLoadDate(LocalDateTime.now());
            return x.toEntity();
        }).toList());
    }
    @Override
    public void updateRecord(LeaveBalanceDTO leaveBalanceDTO) throws HRMSException {
       leaveBalanceRepository.save(leaveBalanceDTO.toEntity());
    }
    @Override
    public void deductLeaveBalance(LeaveBalanceDTO leaveBalanceDTO) throws HRMSException {
       LeaveBalance leaveBalance = leaveBalanceRepository.findById(leaveBalanceDTO.getId()).orElseThrow(() ->new HRMSException("RECORD_NOT_FOUND"));
       if(leaveBalance.getTotalLeaveBalance()<leaveBalanceDTO.getTotalLeaveBalance())throw new HRMSException("NOT_ENOUGH_LEAVE");
       leaveBalance.setTotalLeaveBalance(leaveBalance.getTotalLeaveBalance()-leaveBalanceDTO.getTotalLeaveBalance());
       leaveBalanceRepository.save(leaveBalance);
    }

    @Override
    public List<LeaveBalanceDTO> getAllRecords() throws HRMSException {
       return ((List<LeaveBalance>)leaveBalanceRepository.findAll()).stream().map((x)->x.toDTO()).toList();
    }
    public EmployeeLeaveBalance checkEmployeeLeaveBalance(LeaveBalanceDTO leaveBalanceDTO) throws HRMSException {
        EmployeeLeaveBalance employeeDTO=employeeRepository.findByUniqueNumber(leaveBalanceDTO.getEmpNumber()).orElseThrow(()->new HRMSException("EMPLOYEE_NOT_FOUND"));
        Optional <LeaveBalance> opt=leaveBalanceRepository.findByAsOfDateAndEmpNumber(leaveBalanceDTO.getAsOfDate(),leaveBalanceDTO.getEmpNumber());
        if(opt.isPresent())throw new HRMSException("DUPLICATE_ENTRY");
        return employeeDTO;
    }
    @Override
    public LeaveBalanceDTO getLatestLeaveBalance(String empNumber) throws HRMSException{
        return leaveBalanceRepository.findLatestByEmpNumber(empNumber).orElseThrow(()->new HRMSException(empNumber)).toDTO();
    }
}
