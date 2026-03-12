package com.hrms.repository.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.DataInterface.TeamMemberDetails;
import com.hrms.entity.Timesheet.TeamMember;

public interface TeamMemberRepository extends CrudRepository<TeamMember, Long> {
    @Query("SELECT tm.id as id,CONCAT( tm.employee.firstName, ' ',  tm.employee.familyName) AS name, tm.shift as shift, tm.status as status FROM TeamMember tm WHERE  tm.team.id = :teamId")
    List<TeamMemberDetails> findByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT te.employee.id FROM TeamMember te ")
    List<Long> findEmployeeIds();

    @Query("SELECT te.employee.id FROM TeamMember te WHERE te.status=Status.ACTIVE or te.team.id=:teamId")
    List<Long> findActiveEmployeeIds(@Param("teamId") Long teamId);

    @Query("SELECT tm.id FROM TeamMember tm WHERE tm.team.id=:teamId And tm.employee.id=:employeeId")
    Optional<Long> findTeamMemberId(@Param("teamId") Long teamId, @Param("employeeId") Long employeeId);

    @Query("SELECT tm.id FROM TeamMember tm WHERE  tm.employee.id=:employeeId And tm.status=Status.ACTIVE")
    Optional<Long> findActiveTeamMemberId(@Param("employeeId") Long employeeId);

    @Query("SELECT tm.team.id FROM TeamMember tm WHERE tm.employee.id = :employeeId and tm.status=Status.ACTIVE")
    Optional<Long> findTeamId(@Param("employeeId") Long employeeId);
}
