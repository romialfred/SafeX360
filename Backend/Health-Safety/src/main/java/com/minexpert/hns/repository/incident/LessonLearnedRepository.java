package com.minexpert.hns.repository.incident;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.LessonLearnedDetails;
import com.minexpert.hns.entity.incident.LessonLearned;

public interface LessonLearnedRepository extends CrudRepository<LessonLearned, Long> {
    Optional<LessonLearned> findByIncident_Id(Long incidentId);

    @Query("SELECT new  com.minexpert.hns.dto.LessonLearnedDetails(l.id, l.category , l.description , l.status, l.incident.id , l.incident.title, null, l.employeeId, l.date )  FROM LessonLearned l WHERE l.id = :id AND (:companyId IS NULL OR l.companyId = :companyId)")
    Optional<LessonLearnedDetails> findDetailsById(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("SELECT new com.minexpert.hns.dto.LessonLearnedDetails(l.id, l.category, l.description, l.status, l.incident.id, l.incident.title, null, l.employeeId, l.date) FROM LessonLearned l WHERE l.incident.id = :incidentId AND (:companyId IS NULL OR l.companyId = :companyId)")
    Optional<LessonLearnedDetails> findByIncidentId(@Param("incidentId") Long incidentId, @Param("companyId") Long companyId);

    @Query("SELECT new com.minexpert.hns.dto.LessonLearnedDetails(l.id, l.category, l.description, l.status, l.incident.id, l.incident.title, null, l.employeeId, l.date) FROM LessonLearned l WHERE (:companyId IS NULL OR l.companyId = :companyId)")
    List<LessonLearnedDetails> findAllLessonLearnedDetails(@Param("companyId") Long companyId);
}
