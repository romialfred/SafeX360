package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.Status;

public interface AuditAreasRepository extends CrudRepository<AuditAreas, Long> {

    Optional<AuditAreas> findByNameIgnoreCase(String name);

    List<AuditAreas> findByStatus(Status status);

}
