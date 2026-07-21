package com.hrms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hrms.entity.EmployeeEmergencyContact;

public interface EmployeeEmergencyContactRepository extends JpaRepository<EmployeeEmergencyContact, Long> {

    List<EmployeeEmergencyContact> findByEmployeeIdOrderByPriorityAscIdAsc(Long employeeId);
}
