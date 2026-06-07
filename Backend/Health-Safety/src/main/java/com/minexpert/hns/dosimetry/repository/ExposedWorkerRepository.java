package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.enums.DoseCategory;

/**
 * Repository des travailleurs exposes.
 *
 * <p>Note : la notion de "company" est portee par l'isolation logique mineId (la mine appartient
 * a une company dans le module RH). Les requetes findByCompanyId s'appuient donc sur mineId
 * lorsque le filtrage doit etre fait via le module Dosimetrie.
 */
@Repository
public interface ExposedWorkerRepository extends JpaRepository<ExposedWorker, Long> {

    List<ExposedWorker> findByMineId(Long mineId);

    /** Compat. avec la convention companyId : equivalent a findByMineId pour ce module. */
    default List<ExposedWorker> findByCompanyId(Long companyId) {
        return findByMineId(companyId);
    }

    Optional<ExposedWorker> findByEmployeeId(Long employeeId);

    List<ExposedWorker> findByActiveTrue();

    List<ExposedWorker> findByMineIdAndActiveTrue(Long mineId);

    /**
     * Liste tous les travailleurs actifs d'une mine, ordonnes par employeeId ascendant.
     * Utilise par le Registre (vue par defaut, tri matricule croissant).
     */
    List<ExposedWorker> findByMineIdAndActiveTrueOrderByEmployeeIdAsc(Long mineId);

    /**
     * Page de travailleurs actifs filtres par categorie A/B (paginee pour la liste du Registre).
     */
    Page<ExposedWorker> findByMineIdAndCategoryAndActiveTrue(Long mineId, DoseCategory category,
            Pageable pageable);

    /**
     * Projection optimisee pour la liste du Registre : joint ExposedWorker avec son
     * DoseCumulative de l'annee courante pour recuperer en une seule requete les cumuls
     * annuel / glissant 5 ans / vie entiere.
     *
     * <p>LEFT JOIN sur DoseCumulative : un worker sans cumul calcule reste present avec des
     * valeurs nulles (state initial avant premier recompute). La projection retourne un
     * Object[] dans l'ordre :
     * <ol>
     *   <li>id (Long)</li>
     *   <li>employeeId (Long)</li>
     *   <li>category (DoseCategory)</li>
     *   <li>specialStatus (DoseSpecialStatus)</li>
     *   <li>annualHp10 (Double)</li>
     *   <li>rolling5yHp10 (Double)</li>
     *   <li>lifetimeHp10 (Double)</li>
     * </ol>
     *
     * <p>Le service consommateur (ExposedWorkerQueryService) mappe ces colonnes vers le
     * {@link com.minexpert.hns.dosimetry.dto.ExposedWorkerListItemDTO} apres enrichissement
     * RH (matricule, nom, poste, departement).
     */
    @Query("""
            SELECT w.id, w.employeeId, w.category, w.specialStatus,
                   c.annualHp10, c.rolling5yHp10, c.lifetimeHp10
            FROM ExposedWorker w
            LEFT JOIN DoseCumulative c
              ON c.workerId = w.id AND c.year = :year
            WHERE w.mineId = :mineId AND w.active = true
            ORDER BY w.employeeId ASC
            """)
    List<Object[]> findRegistryProjection(@Param("mineId") Long mineId, @Param("year") int year);
}
