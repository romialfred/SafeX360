package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.enums.Status;

public interface WorkAreaRepository extends CrudRepository<WorkArea, Long> {

    Optional<WorkArea> findByNameIgnoreCaseAndDepartmentId(String name, Long departmentId);

    List<WorkArea> findByStatus(Status status);
}
