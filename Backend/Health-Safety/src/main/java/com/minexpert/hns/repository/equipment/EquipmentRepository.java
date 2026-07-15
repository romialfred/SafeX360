package com.minexpert.hns.repository.equipment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.equipment.Equipment;

public interface EquipmentRepository extends CrudRepository<Equipment, Long> {

    /**
     * Registre complet scopé mine. companyId null (appel système / allMines) ne
     * filtre pas. Tri : ACTIVE en priorité, puis par code — source du sélecteur
     * de cible d'inspection.
     */
    @Query("SELECT e FROM Equipment e WHERE (:companyId IS NULL OR e.companyId = :companyId) "
            + "ORDER BY CASE WHEN e.status = 'ACTIVE' THEN 0 ELSE 1 END, e.code ASC")
    List<Equipment> findAllByCompany(@Param("companyId") Long companyId);

    /** Équipements ACTIVE uniquement (dropdown strict), scopés mine. */
    @Query("SELECT e FROM Equipment e WHERE e.status = 'ACTIVE' "
            + "AND (:companyId IS NULL OR e.companyId = :companyId) ORDER BY e.code ASC")
    List<Equipment> findAllActiveByCompany(@Param("companyId") Long companyId);

    /** Chargement avec garde d'appartenance : renvoie vide si autre mine. */
    @Query("SELECT e FROM Equipment e WHERE e.id = :id AND (:companyId IS NULL OR e.companyId = :companyId)")
    Optional<Equipment> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);

    /** Unicité du code par mine (garde anti-doublon + idempotence du seeder). */
    Optional<Equipment> findByCompanyIdAndCodeIgnoreCase(Long companyId, String code);
}
