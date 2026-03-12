package com.hrms.service;

import java.util.List;

import com.hrms.dto.PositionCategoryDTO;
import com.hrms.exception.HRMSException;

public interface PositionCategoryService {
    public void addPositionCategory(PositionCategoryDTO positionCategoryDTO) throws HRMSException;
    public void updatePositionCategory(PositionCategoryDTO positionCategoryDTO) throws HRMSException;
    public PositionCategoryDTO getPositionCategory(Long id) throws HRMSException;
    public void deletePositionCategory(Long id);
    public List<PositionCategoryDTO> getAllPositionCategories();
}
