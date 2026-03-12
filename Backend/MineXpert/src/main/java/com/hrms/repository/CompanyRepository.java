package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Company;

public interface CompanyRepository extends CrudRepository<Company, Long> {
    List<Company> findByStatusIn(List<String> statuses);
    Optional<Company> findByNameIgnoreCaseAndCountry(String name, String country);
    
}
