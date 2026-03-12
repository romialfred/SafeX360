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

    @Query("SELECT s.id AS id, s.name AS name, s.description AS description,s.level as level, i.id AS incidentCategoryId, i.name AS incidentCategoryName, s.status AS status FROM SeverityLevel s JOIN s.incidentCategory i")
    List<SeverityLevelResponse> findAllWithName();

    @Query("SELECT DISTINCT  s.level as level, s.name as name FROM SeverityLevel s")
    List<SeverityLevelResponse> findDistinctLevelAndName();

    @Query("SELECT s.id AS id, s.name AS name, s.level AS level, i.id as incidentCategoryId, i.name AS incidentCategoryName, s.description as description FROM SeverityLevel s JOIN s.incidentCategory i where s.status = Status.ACTIVE")
    List<SeverityLevelResponse> findAllActiveLevels();

    @Query(value = "SELECT * FROM severity_level WHERE level = :level AND incident_category_id = :incidentCategoryId", nativeQuery = true)
    Optional<SeverityLevel> findByLevelAndIncidentCategory(@Param("level") Integer level,
            @Param("incidentCategoryId") Long incidentCategoryId);
}
