package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.Status;

public interface WorkProcessRepository extends CrudRepository<WorkProcess, Long> {
    Optional<WorkProcess> findByNameIgnoreCaseAndDepartmentId(String name, Long departmentId);

    List<WorkProcess> findByStatus(Status status);
}
