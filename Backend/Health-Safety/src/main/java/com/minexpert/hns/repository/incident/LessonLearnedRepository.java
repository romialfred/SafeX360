package com.minexpert.hns.repository.incident;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.LessonLearnedDetails;
import com.minexpert.hns.entity.incident.LessonLearned;

public interface LessonLearnedRepository extends CrudRepository<LessonLearned, Long> {
    Optional<LessonLearned> findByIncident_Id(Long incidentId);

    @Query("SELECT new  com.minexpert.hns.dto.LessonLearnedDetails(l.id, l.category , l.description , l.status, l.incident.id , l.incident.title, null, l.employeeId, l.date )  FROM LessonLearned l WHERE l.id = ?1")
    Optional<LessonLearnedDetails> findDetailsById(Long id);

    @Query("SELECT new com.minexpert.hns.dto.LessonLearnedDetails(l.id, l.category, l.description, l.status, l.incident.id, l.incident.title, null, l.employeeId, l.date) FROM LessonLearned l WHERE l.incident.id = ?1")
    Optional<LessonLearnedDetails> findByIncidentId(Long incidentId);

    @Query("SELECT new com.minexpert.hns.dto.LessonLearnedDetails(l.id, l.category, l.description, l.status, l.incident.id, l.incident.title, null, l.employeeId, l.date) FROM LessonLearned l")
    List<LessonLearnedDetails> findAllLessonLearnedDetails();
}
