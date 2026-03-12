package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.LessonLearnedDTO;
import com.minexpert.hns.dto.LessonLearnedDetails;
import com.minexpert.hns.exception.HSException;

public interface LessonLearnedService {

    public Long createLessonLearned(LessonLearnedDTO request) throws HSException;

    public void updateLessonLearned(LessonLearnedDTO request) throws HSException;

    public LessonLearnedDetails getLessonLearnedDetails(Long id) throws HSException;

    public LessonLearnedDetails getLessonLearnedDetailsByIncidentId(Long incidentId) throws HSException;

    public List<LessonLearnedDetails> getAllLessonLearnedDetails() throws HSException;

}
