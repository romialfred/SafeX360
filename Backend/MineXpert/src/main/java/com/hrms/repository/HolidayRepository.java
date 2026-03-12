package com.hrms.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.entity.Holiday;

public interface HolidayRepository extends CrudRepository<Holiday, Long> {
    @Query("SELECT h FROM Holiday h WHERE h.startDate > CURRENT_DATE ORDER BY h.startDate ASC LIMIT 1")
    Optional<Holiday> findNextHoliday();

    @Query("SELECT h FROM Holiday h WHERE h.startDate = :date")
    Optional<Holiday> findHolidayByDate(@Param("date") LocalDate date);

    @Query("SELECT h FROM Holiday h WHERE h.startDate > CURRENT_DATE ORDER BY h.startDate ASC LIMIT 4")
    List<Holiday> findNext4Holidays();
}
