package com.hrms.repository.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.hrms.DataInterface.TeamDetails;
import com.hrms.entity.Timesheet.Team;
import com.hrms.enums.TeamStatus;

public interface TeamRepository extends CrudRepository<Team, Long> {

    @Query("""
                SELECT t.id AS id,
                       t.name AS name,
                       d.name AS department,
                       t.type AS type,
                         t.rotation as rotation,
                       d.id AS departmentId,
                       c.id AS companyId,
                       t.shortName AS shortName,
                       t.weekStartDay AS weekStartDay,
                       t.workingHours AS workingHours,
                       t.maxWorkingHours AS maxWorkingHours,
                       t.status AS status,
                       c.name AS company,
                       t.color as color,
                       COUNT(tm) AS memberCount
                FROM Team t
                LEFT JOIN t.department d
                LEFT JOIN t.teamMembers tm
                LEFT JOIN t.company c
                GROUP BY t.id
            """)
    List<TeamDetails> findAllTeamDetails();

    @Query("""
                SELECT t.id AS id,
                       t.name AS name,
                       t.shortName as shortName,
                       t.type as type,
                       d.id AS departmentId,
                       t.weekStartDay AS weekStartDay,
                       t.workingHours AS workingHours,
                       t.maxWorkingHours AS maxWorkingHours,
                       t.status AS status,
                       t.rotation as rotation,
                       c.id AS companyId,
                       t.color as color,
                       t.nextWeekStartDate as nextWeekStartDate,
                          t.description as description

                FROM Team t
                LEFT JOIN t.department d
                LEFT JOIN t.company c
                WHERE t.id = :teamId
            """)
    Optional<TeamDetails> findTeamDetailsById(Long teamId);

    @Query("""
                SELECT t.id AS id
                FROM Team t
                WHERE t.status = :teamStatus
            """)
    List<Long> findAllTeamIds(TeamStatus teamStatus);
}
