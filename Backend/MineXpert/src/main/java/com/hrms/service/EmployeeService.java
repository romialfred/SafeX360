package com.hrms.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.hrms.DataInterface.CategoryCount;
import com.hrms.DataInterface.EmpEmailPosResponse;
import com.hrms.DataInterface.EmployeeDetailsDTO;
import com.hrms.DataInterface.EmployeeDirection;
import com.hrms.DataInterface.EmployeeEmailDTO;
import com.hrms.DataInterface.EmployeeLeaveBalance;
import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.PromotionDetailsDTO;
import com.hrms.dto.DocumentsDTO;
import com.hrms.dto.EmployeeDTO;
import com.hrms.exception.HRMSException;

public interface EmployeeService {
    public void addEmployee(EmployeeDTO employeeDTO) throws HRMSException;

    public EmployeeDTO getEmployee(Long id) throws HRMSException;

    public EmployeeLeaveBalance getEmployeeByUniqueNumber(String uniqueNumber) throws HRMSException;

    public void updateEmployee(EmployeeDTO employeeDTO) throws HRMSException;

    public void deleteEmployee(Long id);

    public List<EmployeeDetailsDTO> getAllEmployees();

    public List<EmployeeNameDTO> getAllEmployeesByDepartment(Long departmentId);

    public List<EmployeeNameDTO> getAllEmployeesByCompany(Long companyId);

    public List<EmployeeNameDTO> getAllHRApproversByCompany(Long companyId);

    public List<EmployeeNameDTO> getQualifiedEmployees();

    public List<EmployeeNameDTO> getEmployeeNamesWithEmail();

    public List<Object[]> getCountsByCompany();

    public List<Object[]> getCountsByDepartment();

    public List<Object[]> getCountsByGender();

    public List<Object[]> getCountsByCompanyAndGender();

    public List<Object[]> getCountsBySeniority();

    public Long getDepartmentCount(Long departmentId);

    public DocumentsDTO addDocument(Long employeeId, String name, MultipartFile file) throws Exception;

    public Resource getDocument(String doc) throws Exception;

    public Resource getProfilePicture(String doc) throws Exception;

    public void deleteDocument(Long id, Long employeeId) throws HRMSException;

    public String updateProfilePicture(Long employeeId, MultipartFile file) throws Exception;

    public String getPicture(Long employeeId) throws Exception;

    public void deletePicture(Long employeeId) throws HRMSException;

    public void promoteEmployee(EmployeeDTO employeeDTO, Long recommendedBy, Long approvedBy, String reason,
            LocalDate endDate) throws HRMSException;

    public List<PromotionDetailsDTO> getAllPromotions();

    public List<EmployeeNameDTO> getEmployeeDropdown();

    public List<Object[]> getEmployeeCountByCategory();

    public List<Object[]> getEmployeeCountByContractType();

    public List<Object[]> getSectorGenderCount();

    public List<EmployeeDetailsDTO> getLast10Employees(Long companyId);

    public Long getEmployeeSalary(Long employeeId);

    public Long getTotalEmployeeCount();

    public List<CategoryCount> getEmployeeContractCategoryCount();

    public List<EmployeeNameDTO> getEmployeesByIds(List<Long> employeeIds);

    public List<EmployeeEmailDTO> getEmployeeEmailsByIds(List<Long> employeeIds);

    public List<EmpEmailPosResponse> getEmployeesWithEmailPosition();

    public List<EmpEmailPosResponse> getEmployeesWithDepartment();

    public EmpEmailPosResponse getEmployeeEmailPositionById(Long employeeId) throws HRMSException;

    public List<EmployeeDirection> getEmployeeWithDirection(List<Long> ids);

    public List<EmployeeDirection> getAllEmployeeWithDirection();

}
