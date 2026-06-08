package com.minexpert.hns.blast.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastRecipient;

@Repository
public interface BlastRecipientRepository extends JpaRepository<BlastRecipient, Long> {

    List<BlastRecipient> findByBlastId(Long blastId);

    void deleteByBlastId(Long blastId);
}
