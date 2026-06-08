package com.minexpert.hns.blast.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastPlan;

@Repository
public interface BlastPlanRepository extends JpaRepository<BlastPlan, Long> {

    Optional<BlastPlan> findByBlastId(Long blastId);
}
