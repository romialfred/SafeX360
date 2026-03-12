package com.hrms.repository.Timesheet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.DataInterface.MemberEntryDetails;
import com.hrms.entity.Timesheet.MemberEntry;

public interface MemberEntryRepository extends CrudRepository<MemberEntry, Long> {

       Optional<MemberEntry> findByTeamMember_IdAndDate(Long teamMemberId, LocalDate date);

       @Query("""
                         SELECT me.id AS id,
                                CONCAT(e.firstName, ' ', e.familyName) AS name,
                                tm.shift AS shift,
                                me.attendance AS attendance,
                                me.date AS date,
                                e.id AS empId,
                                me.teamMember.id AS memberId,
                                me.status AS status,
                                me.type AS type,
                                CASE WHEN me.comments IS NOT NULL THEN true ELSE false END AS commented
                         FROM MemberEntry me
                         JOIN me.employee e
                         JOIN me.teamMember tm
                         WHERE me.timesheet.id = :timesheetId
                     """)
       List<MemberEntryDetails> getMemberEntries(@Param("timesheetId") Long timesheetId);

       @Query("""
                           SELECT
                                CONCAT(e.firstName, ' ', e.familyName) AS name,
                                me.attendance AS attendance,
                                 me.type AS type,
                                e.id AS empId,
                                e.uniqueNumber as empNumber,
                                me.teamMember.team.id as teamId,
                            me.teamMember.team.name AS teamName
                         FROM MemberEntry me
                         JOIN me.employee e
                         WHERE me.timesheet.id IN :timesheets
                     """)
       List<MemberEntryDetails> getMemberEntries(@Param("timesheets") List<Long> timesheets);

       @Query("SELECT  me.comments FROM MemberEntry me  WHERE me.id = :id")
       Optional<String> findCommentsById(Long id);

       @Query("SELECT MIN(me.date), MAX(me.date) FROM MemberEntry me WHERE me.employee.id = :employeeId")
       Object findMinAndMaxDateByEmployeeId(@Param("employeeId") Long employeeId);

       @Query("""
                         SELECT me.timesheet.startDate, me.timesheet.endDate, me.timesheet.id
                         FROM MemberEntry me
                         WHERE me.employee.id = :employeeId
                         GROUP BY me.timesheet.startDate, me.timesheet.endDate, me.timesheet.id
                     """)
       Object[] findTimesheetDatesByEmployeeId(@Param("employeeId") Long employeeId);

       @Query("SELECT me.id AS id,me.attendance as attendance, me.date as date, me.status as status, CASE WHEN me.comments IS NOT NULL THEN true ELSE false END AS commented  FROM MemberEntry me "
                     +
                     "WHERE me.employee.id = :employeeId " +
                     "AND YEAR(me.date) = YEAR(:date) " +
                     "AND MONTH(me.date) = MONTH(:date)")
       List<MemberEntryDetails> findEntriesByEmployeeAndMonth(
                     @Param("employeeId") Long employeeId,
                     @Param("date") LocalDate date);

       @Query("""
                     SELECT me.id AS id,
                            me.attendance AS attendance,
                            me.date AS date,
                            me.status AS status,
                            CASE WHEN me.comments IS NOT NULL THEN true ELSE false END AS commented
                     FROM MemberEntry me
                     WHERE me.employee.id = :employeeId
                     AND me.date BETWEEN :startDate AND :endDate
                     """)
       List<MemberEntryDetails> findEntriesByEmployeeAndDateRange(
                     @Param("employeeId") Long employeeId,
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);

       @Modifying
       @Transactional
       @Query("DELETE FROM MemberEntry me WHERE me.date >= :today AND me.employee.id = :id")
       int deleteByDateGreaterThanEqualAndEmployeeId(LocalDate today, Long id);

       @Query("""
                           SELECT
                                me.id as id,
                                me.status as status
                         FROM MemberEntry me
                         WHERE me.timesheet.id = :timesheetId
                     """)
       List<MemberEntryDetails> getMemberEntryIds(@Param("timesheetId") Long timesheetId);
}
