package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.entity.parameters.IncidentType;
import com.minexpert.hns.enums.Status;

public interface IncidentTypeRepository extends CrudRepository<IncidentType, Long> {
        Optional<IncidentType> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

        @Query("SELECT i.id AS id, i.name AS name, i.description AS description, i.companyId AS companyId, c.id AS incidentCategoryId, c.name AS incidentCategoryName, s.name as severityLevelName, s.level as severityLevel, s.id as severityLevelId, i.status AS status FROM IncidentType i JOIN i.incidentCategory c JOIN i.severityLevel s WHERE (:companyId IS NULL OR i.companyId = :companyId)")
        List<IncidentTypeDetails> findAllWithName(@Param("companyId") Long companyId);

        @Query("SELECT i.id AS id, i.name AS name, i.description AS description, i.companyId AS companyId, c.id AS incidentCategoryId, c.name AS incidentCategoryName, s.name as severityLevelName, s.level as severityLevel, s.id as severityLevelId, i.status AS status FROM IncidentType i JOIN i.incidentCategory c JOIN i.severityLevel s WHERE i.status = :status AND (:companyId IS NULL OR i.companyId = :companyId)")
        List<IncidentTypeDetails> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

        @Query("SELECT i FROM IncidentType i WHERE i.id = :id AND (:companyId IS NULL OR i.companyId = :companyId)")
        Optional<IncidentType> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);

        @Query("SELECT s.level AS level, COUNT(d.id) AS count " +
                        "FROM IncidentType d " +
                        "JOIN d.severityLevel s " +
                        "WHERE (:companyId IS NULL OR d.companyId = :companyId) " +
                        "GROUP BY s.level")
        List<CategorySeverityCount> countTypesByLevel(@Param("companyId") Long companyId);

        @Query("SELECT c.name AS name, COUNT(d.id) AS count " +
                        "FROM IncidentType d " +
                        "JOIN d.incidentCategory c " +
                        "WHERE (:companyId IS NULL OR d.companyId = :companyId) " +
                        "GROUP BY c.name")
        List<CategorySeverityCount> countTypesByCategory(@Param("companyId") Long companyId);

        @Query("SELECT c.name AS name, s.level AS level, COUNT(d.id) AS count " +
                        "FROM IncidentType d " +
                        "JOIN d.incidentCategory c " +
                        "JOIN d.severityLevel s " +
                        "WHERE (:companyId IS NULL OR d.companyId = :companyId) " +
                        "GROUP BY c.name, s.level")
        List<CategorySeverityCount> countByCategoryAndSeverityLevel(@Param("companyId") Long companyId);

}
