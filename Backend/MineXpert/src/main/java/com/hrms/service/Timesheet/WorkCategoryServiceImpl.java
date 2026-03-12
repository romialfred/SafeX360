package com.hrms.service.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.Timesheet.WorkCategoryDTO;
import com.hrms.entity.Timesheet.WorkCategory;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.WorkCategoryRepository;

@Service
public class WorkCategoryServiceImpl implements WorkCategoryService {

    @Autowired
    private WorkCategoryRepository workCategoryRepository;

    @Override
    public void saveWorkCategory(WorkCategoryDTO workCategoryDTO) throws HRMSException {
        Optional<WorkCategory> optional = workCategoryRepository.findByCompany_Id(workCategoryDTO.getCompany().getId());
        if (optional.isPresent()) {
            throw new HRMSException("WORK_CATEGORY_ALREADY_EXISTS");
        }
        workCategoryRepository.save(workCategoryDTO.toEntity());
    }

    @Override
    public List<WorkCategoryDTO> getAllWorkCategories() {
        return ((List<WorkCategory>) workCategoryRepository.findAll()).stream().map(WorkCategory::toDTO).toList();
    }

    @Override
    public WorkCategoryDTO getWorkCategoryById(Long id) throws HRMSException {
        return workCategoryRepository.findById(id).orElseThrow(() -> new HRMSException("WORK_CATEGORY_NOT_FOUND"))
                .toDTO();
    }

    @Override
    public WorkCategoryDTO getWorkCategoryByCompanyId(Long companyId) throws HRMSException {
        return workCategoryRepository.findByCompany_Id(companyId)
                .orElseThrow(() -> new HRMSException("WORK_CATEGORY_NOT_FOUND")).toDTO();
    }

    @Override
    public void updateWorkCategory(WorkCategoryDTO workCategoryDTO) throws HRMSException {
        Optional<WorkCategory> optional = workCategoryRepository.findById(workCategoryDTO.getId());
        if (optional.isEmpty()) {
            throw new HRMSException("WORK_CATEGORY_NOT_FOUND");
        }
        WorkCategory workCategory = optional.get();
        workCategory.setCategories(workCategoryDTO.getCategories());
        workCategoryRepository.save(workCategory);
    }

}
