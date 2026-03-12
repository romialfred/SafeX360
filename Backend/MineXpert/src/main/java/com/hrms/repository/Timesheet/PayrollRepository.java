package com.hrms.repository.Timesheet;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.DataInterface.PayrollDetails;
import com.hrms.entity.Timesheet.Payroll;

public interface PayrollRepository extends CrudRepository<Payroll, Long> {
    @Query("Select p.id as id, p.matricule as matricule,  CONCAT(p.employee.firstName, ' ', p.employee.familyName) as name, p.code as code, p.hours as hours, p.paymentMonth as paymentMonth, p.monthStartDate as monthStartDate, p.monthEndDate as monthEndDate, CONCAT(p.transferredBy.firstName, ' ',  p.transferredBy.familyName) as transferredBy, p.transferredAt as transferredAt from Payroll p")
    List<PayrollDetails> getAllPayrollDetails();

    @Query("Select p.id as id, p.matricule as matricule,  CONCAT(p.employee.firstName, ' ', p.employee.familyName) as name, p.code as code, p.hours as hours, p.paymentMonth as paymentMonth, p.monthStartDate as monthStartDate, p.monthEndDate as monthEndDate, CONCAT(p.transferredBy.firstName, ' ',  p.transferredBy.familyName) as transferredBy, p.transferredAt as transferredAt, p.team.name as teamName, p.team.department.name as departmentName from Payroll p where p.paymentMonth = :month")
    List<PayrollDetails> getAllPayrollDetailsByMonth(@Param("month") LocalDate month);

    @Query("SELECT DISTINCT p.paymentMonth FROM Payroll p ORDER BY p.paymentMonth DESC")
    List<LocalDate> findDistinctMonths();
}
