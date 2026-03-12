package com.minexpert.hns.repository.parameters;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.InternalAuditor;

public interface InternalAuditorRepository extends CrudRepository<InternalAuditor, Long> {
    Optional<InternalAuditor> findByEmployeeId(Long employeeId);

}
