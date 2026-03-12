package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.LessonLearnedDTO;
import com.minexpert.hns.dto.LessonLearnedDetails;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.incident.LessonLearned;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.LessonLearnedRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LessonLearnedServiceImpl implements LessonLearnedService {

    private final LessonLearnedRepository lessonLearnedRepository;

    private final HrmsClient hrmsClient;

    @Override
    public Long createLessonLearned(LessonLearnedDTO request) throws HSException {
        Optional<LessonLearned> opt = lessonLearnedRepository.findByIncident_Id(request.getIncidentId());
        if (opt.isPresent()) {
            throw new HSException("LESSON_LEARNED_ALREADY_EXISTS_FOR_INCIDENT");
        }
        request.setId(null); // Ensure ID is null for creation
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return lessonLearnedRepository.save(request.toEntity()).getId();
    }

    @Override
    public void updateLessonLearned(LessonLearnedDTO request) throws HSException {
        LessonLearned lesson = lessonLearnedRepository.findById(request.getId())
                .orElseThrow(() -> new HSException("LESSON_LEARNED_NOT_FOUND"));
        lesson.setDate(request.getDate());
        lesson.setEmployeeId(request.getEmployeeId());
        lesson.setCategory(request.getCategory());
        lesson.setStatus(request.getStatus());
        lesson.setDescription(request.getDescription());
        lesson.setUpdatedAt(LocalDateTime.now());
        lessonLearnedRepository.save(lesson);
    }

    @Override
    public LessonLearnedDetails getLessonLearnedDetails(Long id) throws HSException {
        LessonLearnedDetails details = lessonLearnedRepository.findDetailsById(id)
                .orElseThrow(() -> new HSException("LESSON_LEARNED_NOT_FOUND"));
        EmpEmailPosResponse res = hrmsClient.getEmployeeWithEmailAndPositionById(details.getEmployeeId());
        details.setEmployeeName(res.getName());
        return details;
    }

    @Override
    public LessonLearnedDetails getLessonLearnedDetailsByIncidentId(Long incidentId) throws HSException {
        LessonLearnedDetails details = lessonLearnedRepository.findByIncidentId(incidentId)
                .orElseThrow(() -> new HSException("LESSON_LEARNED_NOT_FOUND_FOR_INCIDENT"));
        EmpEmailPosResponse res = hrmsClient.getEmployeeWithEmailAndPositionById(details.getEmployeeId());
        details.setEmployeeName(res.getName());
        return details;
    }

    @Override
    public List<LessonLearnedDetails> getAllLessonLearnedDetails() throws HSException {
        List<LessonLearnedDetails> detailsList = lessonLearnedRepository.findAllLessonLearnedDetails();
        List<Long> employeeIds = detailsList.stream()
                .map(LessonLearnedDetails::getEmployeeId)
                .distinct()
                .toList();
        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(employeeIds);
        Map<Long, String> employeeNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        return detailsList.parallelStream()
                .peek(detail -> detail.setEmployeeName(employeeNameMap.get(detail.getEmployeeId())))
                .collect(Collectors.toList());
    }

}
