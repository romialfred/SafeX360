package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.TeamMember;
import com.minexpert.hns.enums.Status;

public interface TeamMemberRepository extends CrudRepository<TeamMember, Long> {
    Optional<TeamMember> findByCompanyIdAndEmployeeId(Long companyId, Long id);

    Optional<TeamMember> findByCompanyIdAndEmployeeIdAndStatus(Long companyId, Long employeeId, Status status);

    @Query("SELECT tm FROM TeamMember tm WHERE (:companyId IS NULL OR tm.companyId = :companyId)")
    List<TeamMember> findAllByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.status = :status AND (:companyId IS NULL OR tm.companyId = :companyId)")
    List<TeamMember> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND (:companyId IS NULL OR tm.companyId = :companyId)")
    List<TeamMember> findAllByTeamId(@Param("companyId") Long companyId, @Param("teamId") Long teamId);

}
