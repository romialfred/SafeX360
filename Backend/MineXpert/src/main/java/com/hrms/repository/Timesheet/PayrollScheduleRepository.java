package com.hrms.repository.Timesheet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.entity.Timesheet.PayrollSchedule;

public interface PayrollScheduleRepository extends CrudRepository<PayrollSchedule, Long> {
    Optional<PayrollSchedule> findByMonth(LocalDate month);

    @Query("SELECT t FROM PayrollSchedule t WHERE " +
            "(t.startDate <= :endDate AND t.endDate >= :startDate)")
    List<PayrollSchedule> findOverlappingPeriods(@Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT DISTINCT YEAR(t.month) FROM PayrollSchedule t ORDER BY YEAR(t.month) DESC")
    List<Integer> findDistinctYears();

    @Query("SELECT t FROM PayrollSchedule t WHERE YEAR(t.month) = :year")
    List<PayrollSchedule> findByYear(@Param("year") int year);

    @Query("SELECT e.endDate FROM PayrollSchedule e WHERE :inputDate BETWEEN e.startDate AND e.endDate")
    Object findMonthEnd(@Param("inputDate") LocalDate inputDate);

}
