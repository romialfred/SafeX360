package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.CompanyDTO;
import com.hrms.entity.Company;
import com.hrms.exception.HRMSException;
import com.hrms.repository.CompanyRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class CompanyServiceImpl implements CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    public void addCompany(CompanyDTO companyDTO) throws HRMSException {
        Optional<Company> optional=companyRepository.findByNameIgnoreCaseAndCountry(companyDTO.getName(), companyDTO.getCountry());
        if (optional.isPresent()) {
            throw new HRMSException("COMPANY_ALREADY_EXISTS");
        }

        companyRepository.save(companyDTO.toEntity());
    }

    public CompanyDTO getCompany(Long id) throws HRMSException {
        return companyRepository.findById(id).orElseThrow(()->new HRMSException("COMPANY_NOT_FOUND")).toDTO();
    }

    public void updateCompany(CompanyDTO companyDTO) throws HRMSException {
        companyRepository.findById(companyDTO.getId()).orElseThrow(()->new HRMSException("COMPANY_NOT_FOUND"));
        Optional<Company> optional=companyRepository.findByNameIgnoreCaseAndCountry(companyDTO.getName(), companyDTO.getCountry());
        if (optional.isPresent() && optional.get().getId()!=companyDTO.getId()) {
            throw new HRMSException("COMPANY_ALREADY_EXISTS");
        }
        companyRepository.save(companyDTO.toEntity());
    }

    @Override
    public List<CompanyDTO> getAllCompanies() {
        List<Company>companies= (List<Company>) companyRepository.findAll();
        return companies.stream().map(company->company.toDTO()).toList();
    }

    @Override
    public List<CompanyDTO> getAllActiveCompanies() {
        return companyRepository.findByStatusIn(List.of("ACTIVE", "CLOSING")).stream().map(company->company.toDTO()).toList();
    }
    
}
