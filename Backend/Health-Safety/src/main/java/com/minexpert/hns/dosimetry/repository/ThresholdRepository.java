package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.Threshold;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

@Repository
public interface ThresholdRepository extends JpaRepository<Threshold, Long> {

    List<Threshold> findByMineId(Long mineId);

    /**
     * Recupere le seuil actif pour un couple (mine, grandeur, categorie de personne).
     * Si aucun seuil specifique a la mine n'existe, le moteur d'alertes pourra utiliser
     * findGlobalDefault(...) en fallback.
     */
    Optional<Threshold> findByMineIdAndGrandeurAndPersonCategoryAndActiveTrue(Long mineId,
            ThresholdGrandeur grandeur, String personCategory);

    /** Fallback : seuil global par defaut (mineId IS NULL). */
    @Query("SELECT t FROM Threshold t WHERE t.mineId IS NULL AND t.grandeur = :grandeur AND t.personCategory = :personCategory AND t.active = true")
    Optional<Threshold> findGlobalDefault(@Param("grandeur") ThresholdGrandeur grandeur,
            @Param("personCategory") String personCategory);

    List<Threshold> findByActiveTrue();
}
