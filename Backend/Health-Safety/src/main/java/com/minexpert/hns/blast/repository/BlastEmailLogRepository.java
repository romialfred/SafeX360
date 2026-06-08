package com.minexpert.hns.blast.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastEmailLog;

@Repository
public interface BlastEmailLogRepository extends JpaRepository<BlastEmailLog, Long> {

    List<BlastEmailLog> findByJobId(Long jobId);
}
