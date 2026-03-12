package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.dto.Timesheet.ConstraintsDTO;
import com.hrms.exception.HRMSException;

public interface ConstraintsService {
    public void addFlag(String flag) throws HRMSException;

    public void activateFlag(String flag) throws HRMSException;

    public void deactivateFlag(String flag) throws HRMSException;

    public ConstraintsDTO getFlag(String flag) throws HRMSException;

    public List<ConstraintsDTO> getAllFlags() throws HRMSException;

    public Boolean isFlagActive(String flag) throws HRMSException;
}
