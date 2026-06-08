package com.minexpert.hns.blast.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastEvacuationReport;

@Repository
public interface BlastEvacuationReportRepository
        extends JpaRepository<BlastEvacuationReport, Long> {

    Optional<BlastEvacuationReport> findByBlastId(Long blastId);
}
