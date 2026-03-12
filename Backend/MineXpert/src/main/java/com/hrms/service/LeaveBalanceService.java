package com.hrms.service;

import java.util.List;

import com.hrms.DataInterface.EmployeeLeaveBalance;
import com.hrms.dto.LeaveBalanceDTO;
import com.hrms.exception.HRMSException;

public interface LeaveBalanceService {
     public void addAllRecords(List<LeaveBalanceDTO> leaveBalanceDTOs) throws HRMSException;
     public void updateRecord(LeaveBalanceDTO leaveBalanceDTO) throws HRMSException;
     public void deductLeaveBalance(LeaveBalanceDTO leaveBalanceDTO) throws HRMSException;
     public List<LeaveBalanceDTO> getAllRecords() throws HRMSException;
     public EmployeeLeaveBalance checkEmployeeLeaveBalance(LeaveBalanceDTO leaveBalanceDTO) throws HRMSException ;
     public LeaveBalanceDTO getLatestLeaveBalance(String empNumber) throws HRMSException;
}