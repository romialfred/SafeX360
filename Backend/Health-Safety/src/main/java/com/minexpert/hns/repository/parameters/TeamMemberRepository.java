package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.TeamMember;
import com.minexpert.hns.enums.Status;

public interface TeamMemberRepository extends CrudRepository<TeamMember, Long> {
    Optional<TeamMember> findByEmployeeId(Long id);

    Optional<TeamMember> findByEmployeeIdAndStatus(Long employeeId, Status status);

    List<TeamMember> findByStatus(Status status);

    List<TeamMember> findByTeam_Id(Long teamId);

}
