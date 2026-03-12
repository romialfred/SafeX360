package com.hrms.repository.Timesheet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.DataInterface.TimesheetDetails;
import com.hrms.entity.Timesheet.Timesheet;

public interface TimesheetRepository extends CrudRepository<Timesheet, Long> {

    @Query("""
            SELECT ts.id AS id,
                               t.name AS teamName,
                               t.id AS teamId,
                               ts.startDate AS startDate,
                               ts.endDate AS endDate,
                               ts.status AS status
                        FROM Timesheet ts
                        LEFT JOIN ts.team t
                        WHERE t.id = :teamId
                ORDER BY ts.startDate DESC
                LIMIT 1
                    """)
    Optional<TimesheetDetails> getLatestTimesheet(@Param("teamId") Long teamId);

    @Query("""
            SELECT ts.id AS id,
                t.name AS teamName,
                t.id AS teamId,
                ts.startDate AS startDate,
                ts.endDate AS endDate,
                ts.status AS status
            FROM Timesheet ts
            LEFT JOIN ts.team t
            WHERE t.id = :teamId
            ORDER BY ts.id DESC
                            """)
    List<TimesheetDetails> getAllTimesheetDetails(@Param("teamId") Long teamId);

    @Query("""
            SELECT ts.id AS id,
                               ts.startDate AS startDate,
                               ts.endDate AS endDate,
                               ts.status AS status,
                               ts.team.name AS teamName,
                               ts.team.id as teamId

                        FROM Timesheet ts
                        WHERE ts.id = :id
                    """)
    Optional<TimesheetDetails> getTimesheet(@Param("id") Long id);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
            "FROM Timesheet t " +
            "WHERE t.team.id = :teamId")
    boolean isTeamHavingTimesheets(@Param("teamId") Long teamId);

    @Query("""
                SELECT team.name as teamName, t.id as id, t.startDate as startDate, t.endDate as endDate,team.type as teamType, t.status as status FROM Timesheet t
                JOIN t.team team
                JOIN team.department dept
                WHERE dept.id = :departmentId
                AND (
                    YEAR(t.startDate) = YEAR(:date) AND MONTH(t.startDate) = MONTH(:date)
                    OR
                    YEAR(t.endDate) = YEAR(:date) AND MONTH(t.endDate) = MONTH(:date)
                )
            """)
    List<TimesheetDetails> findByDepartmentIdAndMonth(
            @Param("departmentId") Long departmentId,
            @Param("date") LocalDate date);

    @Query("""
                 SELECT team.name as teamName, t.id as id, t.startDate as startDate, t.endDate as endDate, t.status as status FROM Timesheet t
                JOIN t.team team
                JOIN team.company c
                WHERE c.id = :companyId
                AND (
                    YEAR(t.startDate) = YEAR(:date) AND MONTH(t.startDate) = MONTH(:date)
                    OR
                    YEAR(t.endDate) = YEAR(:date) AND MONTH(t.endDate) = MONTH(:date)
                )
            """)
    List<TimesheetDetails> findByCompanyIdAndMonth(
            @Param("companyId") Long companyId,
            @Param("date") LocalDate date);

    @Query("""
                 SELECT team.name as teamName,dept.name as department, t.id as id, t.startDate as startDate, t.endDate as endDate,  t.status as status, team.type as teamType FROM Timesheet t
                JOIN t.team team
                 JOIN team.department dept
                WHERE  t.status= TimesheetStatus.APPROVED
            """)
    List<TimesheetDetails> findApprovedTimesheets();

    @Query("""
                 SELECT team.name as teamName,dept.name as department, t.id as id, t.startDate as startDate, t.endDate as endDate,  t.status as status, team.type as teamType FROM Timesheet t
                JOIN t.team team
                 JOIN team.department dept
                WHERE  t.status= TimesheetStatus.VALIDATED
            """)
    List<TimesheetDetails> findValidatedTimesheets();

    @Query("""
                 SELECT team.name as teamName,dept.name as department, t.id as id, t.startDate as startDate, t.endDate as endDate,  t.status as status, team.type as teamType FROM Timesheet t
                JOIN t.team team
                 JOIN team.department dept
                WHERE  ( t.status= TimesheetStatus.DRAFT or t.status= TimesheetStatus.PREPARED) and CURRENT_DATE>=(SELECT e.endDate FROM PayrollSchedule e WHERE t.startDate BETWEEN e.startDate AND e.endDate)
            """)
    List<TimesheetDetails> findFlaggedTimesheets(@Param("date") LocalDate date);

    @Query("""
                SELECT MIN(t.startDate) ,MAX(t.endDate)
                FROM Timesheet t
                  WHERE t.team.department.id = :departmentId
            """)
    Object findTimesheetsByDepartment(@Param("departmentId") Long departmentId);

    @Query("""
                SELECT MIN(t.startDate) ,MAX(t.endDate)
                FROM Timesheet t
                WHERE t.team.company.id = :companyId
            """)
    Object findTimesheetsByCompany(@Param("companyId") Long companyId);
}
