package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.DosimeterAssignment;

@Repository
public interface DosimeterAssignmentRepository extends JpaRepository<DosimeterAssignment, Long> {

    List<DosimeterAssignment> findByWorkerId(Long workerId);

    List<DosimeterAssignment> findByDosimeterId(Long dosimeterId);

    /** Affectations actives = periodEnd IS NULL OR periodEnd >= today. */
    @Query("SELECT a FROM DosimeterAssignment a WHERE a.worker.id = :workerId AND a.returnAck = false")
    List<DosimeterAssignment> findActiveByWorkerId(@Param("workerId") Long workerId);
}
