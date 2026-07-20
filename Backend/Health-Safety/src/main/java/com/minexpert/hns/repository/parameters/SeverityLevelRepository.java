package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.SeverityLevelResponse;
import com.minexpert.hns.entity.parameters.SeverityLevel;

public interface SeverityLevelRepository extends CrudRepository<SeverityLevel, Long> {

    Optional<SeverityLevel> findByNameIgnoreCaseAndIncidentCategory_Id(String name, Long id);

    /*
     * CLOISONNEMENT PAR MINE — SeverityLevel ne porte PAS de companyId : un niveau
     * de gravite appartient a une CATEGORIE d'incident, laquelle porte la mine. Le
     * perimetre est donc applique via la jointure sur la categorie, ce qui evite
     * une colonne redondante (et un risque de desynchronisation avec la categorie).
     * Convention du projet : companyId NULL = vue consolidee « toutes les mines ».
     */

    @Query("SELECT s.id AS id, s.name AS name, s.description AS description,s.level as level, i.id AS incidentCategoryId, i.name AS incidentCategoryName, s.status AS status FROM SeverityLevel s JOIN s.incidentCategory i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<SeverityLevelResponse> findAllWithName(@Param("companyId") Long companyId);

    @Query("SELECT DISTINCT  s.level as level, s.name as name FROM SeverityLevel s JOIN s.incidentCategory i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<SeverityLevelResponse> findDistinctLevelAndName(@Param("companyId") Long companyId);

    @Query("SELECT s.id AS id, s.name AS name, s.level AS level, i.id as incidentCategoryId, i.name AS incidentCategoryName, s.description as description FROM SeverityLevel s JOIN s.incidentCategory i where s.status = Status.ACTIVE AND (:companyId IS NULL OR i.companyId = :companyId)")
    List<SeverityLevelResponse> findAllActiveLevels(@Param("companyId") Long companyId);

    @Query("SELECT s FROM SeverityLevel s JOIN s.incidentCategory i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<SeverityLevel> findAllScoped(@Param("companyId") Long companyId);

    @Query(value = "SELECT * FROM severity_level WHERE level = :level AND incident_category_id = :incidentCategoryId", nativeQuery = true)
    Optional<SeverityLevel> findByLevelAndIncidentCategory(@Param("level") Integer level,
            @Param("incidentCategoryId") Long incidentCategoryId);
}
