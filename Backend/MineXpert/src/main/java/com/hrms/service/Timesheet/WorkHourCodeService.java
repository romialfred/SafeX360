package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.dto.Timesheet.WorkHourCodeDTO;
import com.hrms.exception.HRMSException;

public interface WorkHourCodeService {

    public void createWorkHourCode(WorkHourCodeDTO workHourCodeDTO) throws HRMSException;

    public void updateWorkHourCode(WorkHourCodeDTO workHourCodeDTO) throws HRMSException;

    public void deleteWorkHourCode(String code) throws HRMSException;

    public List<WorkHourCodeDTO> getAllWorkHourCodes();
}
