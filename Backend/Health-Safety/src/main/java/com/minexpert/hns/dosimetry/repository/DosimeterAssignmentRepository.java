package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

    /**
     * Affectation ACTIVE d'un dosimetre = la plus recente non encore rendue (returnAck=false).
     * Permet de verifier qu'un dosimetre n'est pas deja en main d'un travailleur avant un
     * nouvel assignToWorker, et de resoudre le porteur courant pour la liste du parc.
     */
    Optional<DosimeterAssignment> findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(
            Long dosimeterId);

    /** Historique complet des affectations d'un travailleur, plus recent en premier. */
    List<DosimeterAssignment> findByWorkerIdOrderByPeriodStartDesc(Long workerId);

    /**
     * Affectations en retard de restitution : periodEnd est passee mais l'accuse de retour
     * n'a jamais ete enregistre. Sert au tableau des "retours dus" (relance porteurs).
     */
    @Query("SELECT a FROM DosimeterAssignment a "
            + "WHERE a.returnAck = false AND a.periodEnd IS NOT NULL AND a.periodEnd < :today")
    List<DosimeterAssignment> findOverdueReturns(@Param("today") LocalDate today);
}
