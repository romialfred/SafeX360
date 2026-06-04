package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.DepartmentNames;
import com.hrms.dto.DepartmentDTO;
import com.hrms.entity.Department;
import com.hrms.exception.HRMSException;
import com.hrms.repository.DepartmentRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "departmentById", allEntries = true),
            @CacheEvict(cacheNames = "allDepartments", allEntries = true),
            @CacheEvict(cacheNames = "departmentsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "departmentNamesAll", allEntries = true),
    // @CacheEvict(cacheNames = "departmentNamesByIds", allEntries = true)
    })
    public void addDepartment(DepartmentDTO departmentDTO) throws HRMSException {
        if (departmentRepository
                .findByNameIgnoreCaseAndCompany_Id(departmentDTO.getName(), departmentDTO.getCompany().getId())
                .isPresent())
            throw new HRMSException("DEPARTMENT_ALREADY_EXISTS");
        departmentRepository.save(departmentDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "departmentById", key = "#id")
    public DepartmentDTO getDepartment(Long id) throws HRMSException {
        return departmentRepository.findById(id).orElseThrow(() -> new HRMSException("DEPARTMENT_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "departmentById", key = "#departmentDTO.id", condition = "#departmentDTO.id != null"),
            @CacheEvict(cacheNames = "allDepartments", allEntries = true),
            @CacheEvict(cacheNames = "departmentsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "departmentNamesAll", allEntries = true),
            @CacheEvict(cacheNames = "departmentNamesByIds", allEntries = true)
    })
    public void updateDepartment(DepartmentDTO departmentDTO) throws HRMSException {
        departmentRepository.findById(departmentDTO.getId())
                .orElseThrow(() -> new HRMSException("DEPARTMENT_NOT_FOUND"));
        Optional<Department> optional = departmentRepository.findByNameIgnoreCaseAndCompany_Id(departmentDTO.getName(),
                departmentDTO.getCompany().getId());
        if (optional.isPresent() && optional.get().getId() != departmentDTO.getId()) {
            throw new HRMSException("COMPANY_ALREADY_EXISTS");
        }
        departmentRepository.save(departmentDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "allDepartments")
    public List<DepartmentDTO> getAllDepartments() {
        return ((List<Department>) departmentRepository.findAll()).stream().map(department -> department.toDTO())
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "departmentsByCompany", key = "#companyId")
    public List<DepartmentDTO> getDepartmentsByCompanyId(Long companyId) {
        return departmentRepository.findByCompanyId(companyId).stream().map(department -> department.toDTO()).toList();
    }

    @Override
    @Cacheable(cacheNames = "departmentNamesAll")
    public List<DepartmentNames> getAllDepartmentNames() throws HRMSException {
        return departmentRepository.findDepartmentNames();
    }

    @Override
    @Cacheable(cacheNames = "departmentNamesByIds", key = "#ids")
    public List<DepartmentNames> getDepartmentsByIds(List<Long> ids) throws HRMSException {
        return departmentRepository.findDepartmentNamesByIds(ids);
    }

}
