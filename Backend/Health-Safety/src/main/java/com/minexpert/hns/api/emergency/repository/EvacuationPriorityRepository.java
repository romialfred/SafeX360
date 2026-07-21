package com.minexpert.hns.api.emergency.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.EvacuationPriorityPerson;

public interface EvacuationPriorityRepository extends JpaRepository<EvacuationPriorityPerson, Long> {

    List<EvacuationPriorityPerson> findByCompanyId(Long companyId);

    Optional<EvacuationPriorityPerson> findByCompanyIdAndEmployeeId(Long companyId, Long employeeId);
}
