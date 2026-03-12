package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.LeaveSettingDTO;
import com.hrms.entity.LeaveSetting;
import com.hrms.exception.HRMSException;
import com.hrms.repository.LeaveSettingRepository;

@Service
public class LeaveSettingServiceImpl implements LeaveSettingService {

    @Autowired
    private LeaveSettingRepository leaveSettingRepository;
    @Override
    public void addLeaveSetting(LeaveSettingDTO leaveSettingDTO) throws HRMSException{
        List<LeaveSetting>leaves=leaveSettingRepository.findAllByNameIgnoreCaseAndCompany_Id(leaveSettingDTO.getName(), leaveSettingDTO.getCompany().getId());
        if(leaves.size()>0)throw new HRMSException("LEAVE_SETTING_ALREADY_EXISTS");
        leaveSettingRepository.save(leaveSettingDTO.toEntity());
    }

    @Override
    public LeaveSettingDTO getLeaveSetting(Long id) throws HRMSException {
       return leaveSettingRepository.findById(id).orElseThrow(()->new HRMSException("LEAVE_SETTINGS_NOT_FOUND")).toDTO();
    }

    @Override
    public void updateLeaveSetting(LeaveSettingDTO leaveSettingDTO) throws HRMSException{
        leaveSettingRepository.findById(leaveSettingDTO.getId()).orElseThrow(()-> new HRMSException("LEAVE_SETTINGS_NOT_FOUND"));
        List<LeaveSetting>leaves=leaveSettingRepository.findAllByNameIgnoreCaseAndCompany_Id(leaveSettingDTO.getName(), leaveSettingDTO.getCompany().getId());
        if(leaves.size()>0 && leaves.get(0).getId()!=leaveSettingDTO.getId())throw new HRMSException("LEAVE_SETTING_ALREADY_EXISTS");
        leaveSettingRepository.save(leaveSettingDTO.toEntity());
    }

    @Override
    public List<LeaveSettingDTO> getAllLeaveSettings() {
           return ((List<LeaveSetting>) leaveSettingRepository.findAll()).stream().map(leaveSetting->leaveSetting.toDTO()).toList();
    }

    @Override
    public List<LeaveSettingDTO> getActiveLeaveSettings() {
        return ((List<LeaveSetting>) leaveSettingRepository.findAllByStatus("ACTIVE")).stream().map(leaveSetting->leaveSetting.toDTO()).toList();
    }
    
}
