package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.IncidentTeam;
import com.minexpert.hns.enums.Status;

public interface IncidentTeamRepository extends CrudRepository<IncidentTeam, Long> {
    Optional<IncidentTeam> findByDepartmentId(Long id);

    Optional<IncidentTeam> findByNameIgnoreCase(String name);

    List<IncidentTeam> findByStatus(Status status);

}
