package com.minexpert.hns.repository.inspections;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

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
}
