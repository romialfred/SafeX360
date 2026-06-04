package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "companyById", key = "#companyDTO.id", condition = "#companyDTO.id != null"),
            @CacheEvict(cacheNames = "allCompanies", allEntries = true),
            @CacheEvict(cacheNames = "activeCompanies", allEntries = true)
    })
    public void addCompany(CompanyDTO companyDTO) throws HRMSException {
        Optional<Company> optional = companyRepository.findByNameIgnoreCaseAndCountry(companyDTO.getName(),
                companyDTO.getCountry());
        if (optional.isPresent()) {
            throw new HRMSException("COMPANY_ALREADY_EXISTS");
        }

        companyRepository.save(companyDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "companyById", key = "#id")
    public CompanyDTO getCompany(Long id) throws HRMSException {
        return companyRepository.findById(id).orElseThrow(() -> new HRMSException("COMPANY_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "companyById", key = "#companyDTO.id", condition = "#companyDTO.id != null"),
            @CacheEvict(cacheNames = "allCompanies", allEntries = true),
            @CacheEvict(cacheNames = "activeCompanies", allEntries = true)
    })
    public void updateCompany(CompanyDTO companyDTO) throws HRMSException {
        companyRepository.findById(companyDTO.getId()).orElseThrow(() -> new HRMSException("COMPANY_NOT_FOUND"));
        Optional<Company> optional = companyRepository.findByNameIgnoreCaseAndCountry(companyDTO.getName(),
                companyDTO.getCountry());
        if (optional.isPresent() && optional.get().getId() != companyDTO.getId()) {
            throw new HRMSException("COMPANY_ALREADY_EXISTS");
        }
        companyRepository.save(companyDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "allCompanies")
    public List<CompanyDTO> getAllCompanies() {
        List<Company> companies = (List<Company>) companyRepository.findAll();
        return companies.stream().map(company -> company.toDTO()).toList();
    }

    @Override
    @Cacheable(cacheNames = "activeCompanies")
    public List<CompanyDTO> getAllActiveCompanies() {
        return companyRepository.findByStatusIn(List.of("ACTIVE", "CLOSING")).stream()
                .map(company -> company.toDTO()).toList();
    }

}
