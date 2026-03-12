package com.hrms.service;

import java.util.List;

import com.hrms.dto.CompanyDTO;
import com.hrms.exception.HRMSException;

public interface CompanyService {
    public void addCompany(CompanyDTO companyDTO) throws HRMSException;
    public CompanyDTO getCompany(Long id) throws HRMSException;
    public void updateCompany(CompanyDTO companyDTO) throws HRMSException;
    public List<CompanyDTO> getAllCompanies();
    public List<CompanyDTO> getAllActiveCompanies();
}
