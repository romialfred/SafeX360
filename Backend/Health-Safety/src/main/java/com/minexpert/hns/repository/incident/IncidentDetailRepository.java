package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.entity.incident.IncidentDetail;

public interface IncidentDetailRepository extends CrudRepository<IncidentDetail, Long> {
        @Query("SELECT id FROM IncidentDetail id WHERE id.incident.id = :incidentId")
        List<IncidentDetail> findByIncidentId(@Param("incidentId") Long incidentId);

        @Query("SELECT s.level AS level, COUNT(d.id) AS count " +
                        "FROM IncidentDetail d " +
                        "JOIN d.severityLevel s " +
                        "GROUP BY s.level")
        List<CategorySeverityCount> countIncidentDetailsBySeverityLevel();

        @Query("SELECT c.name AS name, COUNT(d.id) AS count " +
                        "FROM IncidentDetail d " +
                        "JOIN d.incidentCategory c " +
                        "GROUP BY c.name")
        List<CategorySeverityCount> countIncidentDetailsByCategory();

        @Query("SELECT c.name AS name, s.level AS level, COUNT(d.id) AS count " +
                        "FROM IncidentDetail d " +
                        "JOIN d.incidentCategory c " +
                        "JOIN d.severityLevel s " +
                        "GROUP BY c.name, s.level")
        List<CategorySeverityCount> countByCategoryAndSeverityLevel();
}
