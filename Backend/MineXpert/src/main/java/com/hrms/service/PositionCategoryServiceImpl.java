package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.PositionCategoryDTO;
import com.hrms.entity.PositionCategory;
import com.hrms.exception.HRMSException;
import com.hrms.repository.PositionCategoryRepository;

@Service
@Transactional
public class PositionCategoryServiceImpl implements PositionCategoryService {

    @Autowired
    private PositionCategoryRepository positionCategoryRepository;
    @Override
    public void addPositionCategory(PositionCategoryDTO positionCategoryDTO) throws HRMSException {
        if(positionCategoryRepository.findByNameIgnoreCaseAndGradeIgnoreCase(positionCategoryDTO.getName(), positionCategoryDTO.getGrade()).isPresent())throw new HRMSException("POSITION_CATEGORY_ALREADY_EXISTS");
       positionCategoryRepository.save(positionCategoryDTO.toEntity());
    }
    @Override
    public void updatePositionCategory(PositionCategoryDTO positionCategoryDTO) throws HRMSException {
        positionCategoryRepository.findById(positionCategoryDTO.getId()).orElseThrow(()->new HRMSException("POSITION_CATEGORY_NOT_FOUND"));
        Optional<PositionCategory> optional= positionCategoryRepository.findByNameIgnoreCaseAndGradeIgnoreCase(positionCategoryDTO.getName(), positionCategoryDTO.getGrade());
        if(optional.isPresent() && optional.get().getId()!=positionCategoryDTO.getId()){
            throw new HRMSException("POSITION_CATEGORY_ALREADY_EXISTS");
        }
        positionCategoryRepository.save(positionCategoryDTO.toEntity());
    }

    @Override
    public PositionCategoryDTO getPositionCategory(Long id) throws HRMSException {

        return positionCategoryRepository.findById(id).orElseThrow(()->new HRMSException("POSITION_CATEGORY_NOT_FOUND")).toDTO();
    }

    @Override
    public void deletePositionCategory(Long id) {
        positionCategoryRepository.deleteById(id);
    }

    @Override
    public List<PositionCategoryDTO> getAllPositionCategories() {
        return ((List<PositionCategory>) positionCategoryRepository.findAll()).stream().map(positionCategory->positionCategory.toDTO()).toList();
    }

    
}
