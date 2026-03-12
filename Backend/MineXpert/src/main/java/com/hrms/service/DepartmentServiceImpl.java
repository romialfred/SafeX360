package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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
    public void addDepartment(DepartmentDTO departmentDTO) throws HRMSException {
        if (departmentRepository
                .findByNameIgnoreCaseAndCompany_Id(departmentDTO.getName(), departmentDTO.getCompany().getId())
                .isPresent())
            throw new HRMSException("DEPARTMENT_ALREADY_EXISTS");
        departmentRepository.save(departmentDTO.toEntity());
    }

    @Override
    public DepartmentDTO getDepartment(Long id) throws HRMSException {
        return departmentRepository.findById(id).orElseThrow(() -> new HRMSException("DEPARTMENT_NOT_FOUND")).toDTO();
    }

    @Override
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
    public List<DepartmentDTO> getAllDepartments() {
        return ((List<Department>) departmentRepository.findAll()).stream().map(department -> department.toDTO())
                .toList();
    }

    @Override
    public List<DepartmentDTO> getDepartmentsByCompanyId(Long companyId) {
        return departmentRepository.findByCompanyId(companyId).stream().map(department -> department.toDTO()).toList();
    }

    @Override
    public List<DepartmentNames> getAllDepartmentNames() throws HRMSException {
        return departmentRepository.findDepartmentNames();
    }

    @Override
    public List<DepartmentNames> getDepartmentsByIds(List<Long> ids) throws HRMSException {
        return departmentRepository.findDepartmentNamesByIds(ids);
    }

}
