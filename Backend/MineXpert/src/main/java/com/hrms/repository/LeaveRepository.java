package com.hrms.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.dto.LeaveStatus;
import com.hrms.entity.Leave;

public interface LeaveRepository extends CrudRepository<Leave, Long> {
    @Query("SELECT l FROM Leave l WHERE l.empId = :empId AND l.startDate > CURRENT_DATE ORDER BY l.startDate ASC")
    List<Leave> findUpcomingLeaves(@Param("empId") Long empId);

    List<Leave> findByEmpId(Long empId);

    List<Leave> findByApproverId(Long empId);

    @Query("SELECT l.type AS leaveType, SUM(DATEDIFF( l.endDate, l.startDate) + 1) AS totalDays " +
            "FROM Leave l " +
            "WHERE l.status = :status AND l.empId = :empId " +
            "GROUP BY l.type")
//     @Query("SELECT l.type AS leaveType, SUM(DATEDIFF(DAY, l.startDate, l.endDate)+ 1) AS totalDays " + "FROM Leave l " + "WHERE l.status = :status AND l.empId = :empId " + "GROUP BY l.type")
    List<Object[]> findTotalLeaveDaysGroupedByTypeAndEmpId(@Param("empId") Long empId,
            @Param("status") LeaveStatus status);

    @Query(value = """
                SELECT l.type,
                       COUNT(DISTINCT l.emp_id) AS employeeCount,
                       SUM(l.no_of_days) AS totalLeaveDays
                FROM `leave` l
                JOIN employee e ON l.emp_id = e.id
                WHERE l.start_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
                      AND l.status = :approvedStatus
                      AND e.department_id = :departmentId
                GROUP BY l.type
            """, nativeQuery = true)
    List<Object[]> getLeaveSummary(
            @Param("departmentId") Long departmentId,
            @Param("approvedStatus") LeaveStatus approvedStatus);

    @Query(value = """
                    SELECT  CASE l.status
                WHEN 0 THEN 'Pending Leaves'
                WHEN 1 THEN 'Planned Leaves'
                WHEN 2 THEN 'Rejected Leaves'
            END AS status,
                           COUNT(DISTINCT l.emp_id) AS employeeCount,
                           SUM(l.no_of_days) AS totalLeaveDays
                    FROM `leave` l
                    JOIN employee e ON l.emp_id = e.id
                    WHERE l.start_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
                          AND e.department_id = :departmentId
                    GROUP BY l.status
                """, nativeQuery = true)
        //         @Query(value = """
        //        SELECT CASE l.status
        //                   WHEN 0 THEN 'Pending Leaves'
        //                   WHEN 1 THEN 'Planned Leaves'
        //                   WHEN 2 THEN 'Rejected Leaves'
        //               END AS status,
        //               COUNT(DISTINCT l.emp_id) AS employeeCount,
        //               SUM(l.no_of_days) AS totalLeaveDays
        //        FROM [leave] l
        //        JOIN employee e ON l.emp_id = e.id
        //        WHERE l.start_date BETWEEN CAST(GETDATE() AS DATE) 
        //                               AND DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
        //              AND e.department_id = :departmentId
        //        GROUP BY l.status
        //        """, nativeQuery = true)

    List<Object[]> getLeaveSummaryByStatus(@Param("departmentId") Long departmentId);

    @Query("""
                SELECT COUNT(DISTINCT l.empId)
                FROM Leave l
                JOIN Employee e ON l.empId = e.id
                WHERE l.status = :approvedStatus
                  AND CURRENT_DATE BETWEEN l.startDate AND l.endDate
                  AND e.department.id = :departmentId
            """)
    Long getEmployeeCountAbsentTodayInDepartment(@Param("approvedStatus") LeaveStatus approvedStatus,
            @Param("departmentId") Long departmentId);

    @Query("""
                SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END
                FROM Leave l
                WHERE l.empId = :empId
                  AND l.status IN (com.hrms.dto.LeaveStatus.APPROVED, com.hrms.dto.LeaveStatus.PENDING)
                  AND (
                        (:startDate BETWEEN l.startDate AND l.endDate) OR
                        (:endDate BETWEEN l.startDate AND l.endDate) OR
                        (l.startDate BETWEEN :startDate AND :endDate) OR
                        (l.endDate BETWEEN :startDate AND :endDate)
                  )
            """)
    boolean existsLeaveInRange(@Param("empId") Long empId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
                SELECT COALESCE(SUM(l.noOfDays), 0)
                FROM Leave l
                WHERE l.empId = :employeeId
                  AND YEAR(l.startDate) = YEAR(CURRENT_DATE)
                  AND l.status IN (com.hrms.dto.LeaveStatus.APPROVED, com.hrms.dto.LeaveStatus.PENDING)
            """)
    Long getTotalLeavesForCurrentYear(@Param("employeeId") Long employeeId);

    @Query("SELECT COUNT(l) FROM Leave l WHERE l.empId = :employeeId AND l.status = com.hrms.dto.LeaveStatus.PENDING")
Long countPendingRequests(@Param("employeeId") Long employeeId);
}
