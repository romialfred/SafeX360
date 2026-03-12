package com.hrms.repository.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.DataInterface.TeamManagerDetails;
import com.hrms.DataInterface.TeamRoleDetails;
import com.hrms.entity.Timesheet.TeamManager;
import com.hrms.enums.Role;

public interface TeamManagerRepository extends CrudRepository<TeamManager, Long> {
    @Query("SELECT tm.id as id,CONCAT( tm.employee.firstName, ' ',  tm.employee.familyName) AS name, tm.role as role, tm.status as status FROM TeamManager tm WHERE  tm.team.id = :teamId")
    List<TeamManagerDetails> findByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT tm.id as id,CONCAT( tm.employee.firstName, ' ',  tm.employee.familyName) AS name, tm.employee.professionalEmail as email, tm.role as role, tm.status as status FROM TeamManager tm WHERE  tm.team.id = :teamId")
    List<TeamManagerDetails> findByTeamIdWithEmail(@Param("teamId") Long teamId);

    @Query("SELECT tm.id as id,CONCAT( tm.employee.firstName, ' ',  tm.employee.familyName) AS name, tm.role as role, tm.status as status FROM TeamManager tm WHERE  tm.team.id = :teamId and tm.status=Status.ACTIVE")
    List<TeamManagerDetails> findActiveByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT te.employee.id FROM TeamManager te WHERE  te.team.id=:teamId")
    List<Long> findAllEmployeeIds(@Param("teamId") Long teamId);

    @Query("SELECT DISTINCT tm.role as role FROM TeamManager tm WHERE  tm.team.id = :teamId And tm.status=Status.ACTIVE")
    List<Role> findAvailableRoles(@Param("teamId") Long teamId);

    @Query("SELECT tm.id FROM TeamManager tm WHERE tm.team.id=:teamId And tm.employee.id=:employeeId")
    Optional<Long> findTeamManagerId(@Param("teamId") Long teamId, @Param("employeeId") Long employeeId);

    @Query("SELECT tm.id FROM TeamManager tm WHERE tm.team.id=:teamId And tm.role=:role And tm.status=Status.ACTIVE")
    Optional<Long> findActiveTeamManagerId(@Param("teamId") Long teamId, @Param("role") Role role);

    @Query("SELECT tm.team.id as id, tm.team.department.name as department, tm.team.type as type, tm.team.name as name, tm.role as role FROM TeamManager tm WHERE tm.employee.id=:id and tm.status=Status.ACTIVE")
    List<TeamRoleDetails> findTeamRoleDetails(@Param("id") Long id);

    @Query("SELECT tm.team.id as id, tm.team.type as type, tm.team.name as name, tm.role as role FROM TeamManager tm WHERE tm.employee.id=:id and tm.status=Status.ACTIVE")
    List<TeamRoleDetails> findApproversTeam(@Param("id") Long id);
}
