package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.entity.incident.WitnessStatement;

public interface WitnessStatementRepository extends JpaRepository<WitnessStatement, Long> {

    List<WitnessStatement> findByInvestigationIdOrderByTakenAtAsc(Long investigationId);
}
