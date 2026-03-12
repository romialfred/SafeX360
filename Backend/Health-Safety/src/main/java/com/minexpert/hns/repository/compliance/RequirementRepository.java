package com.minexpert.hns.repository.compliance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.Status;

public interface RequirementRepository extends CrudRepository<Requirement, Long> {
    Optional<Requirement> findByTitleIgnoreCase(String title);

    List<Requirement> findByStatus(Status status);

}
