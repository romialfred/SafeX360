package com.hrms.service;

import java.util.List;

import com.hrms.dto.LeaveSettingDTO;
import com.hrms.exception.HRMSException;

public interface LeaveSettingService {
    public void addLeaveSetting(LeaveSettingDTO leaveSettingDTO) throws HRMSException;
    public LeaveSettingDTO getLeaveSetting(Long id) throws HRMSException;
    public void updateLeaveSetting(LeaveSettingDTO leaveSettingDTO) throws HRMSException;
    public List<LeaveSettingDTO> getAllLeaveSettings();
    public List<LeaveSettingDTO> getActiveLeaveSettings();
}
