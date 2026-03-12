package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.dto.Timesheet.WorkCategoryDTO;
import com.hrms.exception.HRMSException;

public interface WorkCategoryService {
    public void saveWorkCategory(WorkCategoryDTO workCategoryDTO) throws HRMSException;

    public List<WorkCategoryDTO> getAllWorkCategories();

    public void updateWorkCategory(WorkCategoryDTO workCategoryDTO) throws HRMSException;

    public WorkCategoryDTO getWorkCategoryById(Long id) throws HRMSException;

    public WorkCategoryDTO getWorkCategoryByCompanyId(Long companyId) throws HRMSException;

}
