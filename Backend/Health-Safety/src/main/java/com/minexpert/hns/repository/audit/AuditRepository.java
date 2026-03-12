package com.minexpert.hns.repository.audit;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.audit.Audit;

public interface AuditRepository extends CrudRepository<Audit, Long> {

    @Query("SELECT i FROM Audit i WHERE FUNCTION('YEAR', i.createdAt) = :year ORDER BY i.id DESC")
    List<Audit> findTopByYearOrderByIdDesc(@Param("year") int year, Pageable pageable);

    @Query("SELECT a FROM Audit a WHERE a.planningStatus IS NOT NULL")
    List<Audit> findAllWithNonNullPlanningStatus();

    Optional<Audit> findFirstByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate date);

    Optional<Audit> findFirstByEndDateGreaterThanEqualOrderByEndDateAsc(LocalDate date);
}
