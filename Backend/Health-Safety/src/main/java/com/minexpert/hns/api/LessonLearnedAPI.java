package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.LessonLearnedDTO;
import com.minexpert.hns.dto.LessonLearnedDetails;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.LessonLearnedService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/lesson-learned")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class LessonLearnedAPI {
    private final LessonLearnedService lessonLearnedService;

    @PostMapping("/create")
    public ResponseEntity<Long> createLessonLearned(@RequestParam(required = false) Long companyId,
            @RequestBody LessonLearnedDTO request) throws HSException {
        if (companyId != null) {
            request.setCompanyId(companyId);
        }
        return new ResponseEntity<>(lessonLearnedService.createLessonLearned(request), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateLessonLearned(@RequestParam(required = false) Long companyId,
            @RequestBody LessonLearnedDTO request) throws HSException {
        if (companyId != null) {
            request.setCompanyId(companyId);
        }
        lessonLearnedService.updateLessonLearned(request);
        return new ResponseEntity<>(new ResponseDTO("Lesson Learned updated."), HttpStatus.OK);
    }

    @GetMapping("/details/{id}")
    public ResponseEntity<LessonLearnedDetails> getLessonLearnedDetails(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(lessonLearnedService.getLessonLearnedDetails(id, companyId), HttpStatus.OK);
    }

    @GetMapping("/detailsByIncidentId/{incidentId}")
    public ResponseEntity<LessonLearnedDetails> getLessonLearnedDetailsByIncidentId(@PathVariable Long incidentId,
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(lessonLearnedService.getLessonLearnedDetailsByIncidentId(incidentId, companyId),
                HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<LessonLearnedDetails>> getAllLessonLearnedDetails(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(lessonLearnedService.getAllLessonLearnedDetails(companyId), HttpStatus.OK);
    }

}
