package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hrms.entity.EmployeeEvacuation;

public interface EmployeeEvacuationRepository extends JpaRepository<EmployeeEvacuation, Long> {

    Optional<EmployeeEvacuation> findByEmployeeId(Long employeeId);

    List<EmployeeEvacuation> findByCompanyId(Long companyId);
}
