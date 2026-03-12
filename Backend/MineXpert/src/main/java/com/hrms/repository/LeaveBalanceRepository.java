package com.hrms.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.entity.LeaveBalance;

public interface LeaveBalanceRepository extends CrudRepository<LeaveBalance, Long> {
    Optional<LeaveBalance> findByAsOfDateAndEmpNumber(LocalDate asOfDate, String empNumber);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.empNumber = :empNumber " +
            "ORDER BY lb.asOfDate DESC LIMIT 1")
    Optional<LeaveBalance> findLatestByEmpNumber(@Param("empNumber") String empNumber);
}
