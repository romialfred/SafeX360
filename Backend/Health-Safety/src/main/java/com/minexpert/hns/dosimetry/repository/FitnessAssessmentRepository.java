package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.FitnessAssessment;
import com.minexpert.hns.dosimetry.enums.FitnessLevel;

@Repository
public interface FitnessAssessmentRepository extends JpaRepository<FitnessAssessment, Long> {

    List<FitnessAssessment> findByWorkerIdOrderByAssessmentDateDesc(Long workerId);

    /**
     * Derniere fiche signee pour un travailleur (= aptitude en vigueur). Si plusieurs
     * fiches a la meme date, on prend l'id le plus eleve.
     */
    @Query("SELECT f FROM FitnessAssessment f WHERE f.workerId = :workerId AND f.signed = true "
            + "ORDER BY f.assessmentDate DESC, f.id DESC")
    List<FitnessAssessment> findSignedByWorker(@Param("workerId") Long workerId);

    default Optional<FitnessAssessment> findCurrentSigned(Long workerId) {
        List<FitnessAssessment> list = findSignedByWorker(workerId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    List<FitnessAssessment> findByMineIdAndFitness(Long mineId, FitnessLevel fitness);

    /**
     * Fiches dont la date de fin de validite est dans la fenetre [today, cutoff]. Utilise
     * par {@code checkExpiringAssessments}.
     */
    @Query("SELECT f FROM FitnessAssessment f WHERE f.validUntil IS NOT NULL "
            + "AND f.validUntil BETWEEN :from AND :to AND f.signed = true")
    List<FitnessAssessment> findExpiringBetween(@Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Fiches en attente de signature pour un medecin donne (tableau de bord medical).
     */
    List<FitnessAssessment> findByPhysicianIdAndSignedFalse(Long physicianId);
}
