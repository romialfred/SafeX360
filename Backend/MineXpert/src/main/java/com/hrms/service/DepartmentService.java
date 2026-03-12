package com.hrms.service;

import java.util.List;

import com.hrms.DataInterface.DepartmentNames;
import com.hrms.dto.DepartmentDTO;
import com.hrms.exception.HRMSException;

public interface DepartmentService {
    public void addDepartment(DepartmentDTO departmentDTO) throws HRMSException;

    public DepartmentDTO getDepartment(Long id) throws HRMSException;

    public void updateDepartment(DepartmentDTO departmentDTO) throws HRMSException;

    public List<DepartmentDTO> getAllDepartments();

    public List<DepartmentDTO> getDepartmentsByCompanyId(Long companyId);

    public List<DepartmentNames> getAllDepartmentNames() throws HRMSException;

    public List<DepartmentNames> getDepartmentsByIds(List<Long> ids)
            throws HRMSException;
}
