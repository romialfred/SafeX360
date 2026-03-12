package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.entity.parameters.IncidentType;

public interface IncidentTypeRepository extends CrudRepository<IncidentType, Long> {
    Optional<IncidentType> findByNameIgnoreCase(String name);

    @Query("SELECT i.id AS id, i.name AS name, i.description AS description, c.id AS incidentCategoryId, c.name AS incidentCategoryName, s.name as severityLevelName, s.level as severityLevel, s.id as severityLevelId, i.status AS status FROM IncidentType i JOIN i.incidentCategory c JOIN i.severityLevel s")
    List<IncidentTypeDetails> findAllWithName();

    @Query("SELECT i.id AS id, i.name AS name,c.id as incidentCategoryId, c.name as incidentCategoryName, s.name as severityLevelName, s.level as severityLevel, s.id as severityLevelId FROM IncidentType i JOIN i.incidentCategory c JOIN i.severityLevel s where i.status = Status.ACTIVE")
    List<IncidentTypeDetails> findAllActiveTypes();

    @Query("SELECT s.level AS level, COUNT(d.id) AS count " +
            "FROM IncidentType d " +
            "JOIN d.severityLevel s " +
            "GROUP BY s.level")
    List<CategorySeverityCount> countTypesByLevel();

    @Query("SELECT c.name AS name, COUNT(d.id) AS count " +
            "FROM IncidentType d " +
            "JOIN d.incidentCategory c " +
            "GROUP BY c.name")
    List<CategorySeverityCount> countTypesByCategory();

    @Query("SELECT c.name AS name, s.level AS level, COUNT(d.id) AS count " +
            "FROM IncidentType d " +
            "JOIN d.incidentCategory c " +
            "JOIN d.severityLevel s " +
            "GROUP BY c.name, s.level")
    List<CategorySeverityCount> countByCategoryAndSeverityLevel();

}
