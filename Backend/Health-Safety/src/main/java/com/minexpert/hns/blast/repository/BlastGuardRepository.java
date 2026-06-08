package com.minexpert.hns.blast.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastGuard;

@Repository
public interface BlastGuardRepository extends JpaRepository<BlastGuard, Long> {

    List<BlastGuard> findByBlastId(Long blastId);

    void deleteByBlastId(Long blastId);
}
