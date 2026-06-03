package com.hrms.service;

import java.util.List;

import com.hrms.dto.LeaveDTO;
import com.hrms.exception.HRMSException;

public interface LeaveService {
    public Long addLeave(LeaveDTO leaveDTO) throws HRMSException;

    // public boolean isLeaveExists(Long empId, LocalDateTime startDate,
    // LocalDateTime endDate);
    public LeaveDTO getLeave(Long id) throws HRMSException;

    public void updateLeave(LeaveDTO leaveDTO) throws Exception;

    public void deleteLeave(Long id) throws HRMSException;

    public List<LeaveDTO> getAllLeaves();

    public List<LeaveDTO> getAllLeavesByEmpId(Long empId);

    public List<LeaveDTO> getAllLeavesByApproverId(Long approverId);

    public LeaveDTO getNextLeave(Long empId) throws HRMSException;

    public List<Object[]> getLeaveDaysByType(Long empId);

    public List<Object[]> getLeaveSummary(Long departmentId);

    public List<Object[]> getLeaveSummaryByStatus(Long departmentId);

    public Long getAbsentCount(Long departmentId);

    public Long getLeaveCountForEmployee(Long empId);

    public Long getPendingLeaveCountForEmployee(Long empId);
}
