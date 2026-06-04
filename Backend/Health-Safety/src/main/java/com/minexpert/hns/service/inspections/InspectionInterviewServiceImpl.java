package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.inspections.InspectionInterviewsDTO;
import com.minexpert.hns.entity.inspections.InspectionInterviews;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.InspectionInterviewsRepository;

@Service
@Transactional
public class InspectionInterviewServiceImpl implements InspectionInterviewService {

    @Autowired
    private InspectionInterviewsRepository inspectionInterviewsRepository;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "inspectionInterviewById", allEntries = true),
            @CacheEvict(cacheNames = "inspectionInterviewsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionInterviewByInspection", key = "#interviewDTO.inspectionId", condition = "#interviewDTO.inspectionId != null")
    })
    public Long createInterview(InspectionInterviewsDTO interviewDTO) throws HSException {
        interviewDTO.setCreatedAt(LocalDateTime.now());
        interviewDTO.setUpdatedAt(LocalDateTime.now());
        return inspectionInterviewsRepository.save(interviewDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "inspectionInterviewById", key = "#id")
    public InspectionInterviewsDTO getInterviewById(Long id) throws HSException {
        return inspectionInterviewsRepository.findById(id)
                .orElseThrow(() -> new HSException("INTERVIEW_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionInterviewById", key = "#interviewDTO.id"),
            @CacheEvict(cacheNames = "inspectionInterviewsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionInterviewByInspection", allEntries = true)
    })
    public void updateInterview(InspectionInterviewsDTO interviewDTO) throws HSException {
        InspectionInterviews existingInterview = inspectionInterviewsRepository.findById(interviewDTO.getId())
                .orElseThrow(() -> new HSException("INTERVIEW_NOT_FOUND"));
        existingInterview.setEmployees(interviewDTO.getEmployees().toString());
        existingInterview.setInterviewDate(interviewDTO.getInterviewDate());
        existingInterview.setDescription(interviewDTO.getDescription());
        existingInterview.setUpdatedAt(LocalDateTime.now());
        inspectionInterviewsRepository.save(existingInterview);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionInterviewById", key = "#id"),
            @CacheEvict(cacheNames = "inspectionInterviewsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionInterviewByInspection", allEntries = true)
    })
    public void deleteInterview(Long id) throws HSException {
        inspectionInterviewsRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = "inspectionInterviewsAll")
    public List<InspectionInterviewsDTO> getAllInterviews() throws HSException {
        return ((List<InspectionInterviews>) inspectionInterviewsRepository.findAll()).stream()
                .map(InspectionInterviews::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = "inspectionInterviewByInspection", key = "#inspectionId")
    public InspectionInterviewsDTO getInterviewsByInspectionId(Long inspectionId) throws HSException {
        InspectionInterviews interviews = inspectionInterviewsRepository.findByGeneralInspection_Id(inspectionId)
                .orElse(null);
        return interviews != null ? interviews.toDTO() : null;

    }

}
