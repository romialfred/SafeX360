package com.minexpert.hns.repository.inspections;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.inspections.InspectionTemplate;
import com.minexpert.hns.enums.InspectionTemplateType;

/**
 * Acces aux modeles d'inspection (templates). Les templates sont des
 * referentiels reutilises : la cardinalite reste modeste (quelques dizaines
 * par mine), donc on retourne des listes plates sans pagination cote backend
 * (filtrage cote frontend).
 */
public interface InspectionTemplateRepository extends JpaRepository<InspectionTemplate, Long> {

    /** Templates actifs filtres par type, tries par nom. */
    List<InspectionTemplate> findByTypeAndActiveTrueOrderByNameAsc(InspectionTemplateType type);

    /** Tous les templates actifs (toutes types confondus), tries par type puis nom. */
    List<InspectionTemplate> findByActiveTrueOrderByTypeAscNameAsc();

    /** Recherche par code unique (utilise par le seed pour upsert idempotent). */
    Optional<InspectionTemplate> findByCode(String code);

    // ── Variantes cloisonnées par mine ──
    //
    // Un template est un RÉFÉRENTIEL, pas une donnée de mine : une checklist
    // « Camion benne » est générique. On applique donc la convention déjà en
    // vigueur sur le projet (cf. HsActivityRepository, EmergencyUserPermission-
    // Repository) : `companyId IS NULL` = CATALOGUE GLOBAL, visible de TOUTES
    // les mines ; `companyId = X` = personnalisation propre à la mine X.
    //
    // Sans la clause `t.companyId IS NULL`, un catalogue global était invisible
    // dès qu'une mine active était sélectionnée : les mines autres que la 1
    // n'avaient AUCUN modèle applicable et ne pouvaient plus rien planifier une
    // fois le filtrage par scopeRef en place.

    @Query("SELECT t FROM InspectionTemplate t WHERE t.type = :type AND t.active = true "
            + "AND (:companyId IS NULL OR t.companyId IS NULL OR t.companyId = :companyId) "
            + "ORDER BY t.name ASC")
    List<InspectionTemplate> findActiveByTypeAndCompany(@Param("type") InspectionTemplateType type,
            @Param("companyId") Long companyId);

    @Query("SELECT t FROM InspectionTemplate t WHERE t.active = true "
            + "AND (:companyId IS NULL OR t.companyId IS NULL OR t.companyId = :companyId) "
            + "ORDER BY t.type ASC, t.name ASC")
    List<InspectionTemplate> findActiveByCompany(@Param("companyId") Long companyId);
}
