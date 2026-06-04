package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.SeverityLevelDTO;
import com.minexpert.hns.dto.response.SeverityLevelResponse;
import com.minexpert.hns.entity.parameters.SeverityLevel;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.SeverityLevelRepository;

@Service
@Transactional
public class SeverityLevelServiceImpl implements SeverityLevelService {

    @Autowired
    private SeverityLevelRepository severityLevelRepository;

    @Override
    public Long addSeverityLevel(SeverityLevelDTO severityLevelDTO) throws HSException {

        Optional<SeverityLevel> optional = severityLevelRepository
                .findByLevelAndIncidentCategory(severityLevelDTO.getLevel(), severityLevelDTO.getIncidentCategoryId());
        if (optional.isPresent()) {
            throw new HSException("SEVERITY_LEVEL_ALREADY_EXISTS");
        }
        severityLevelDTO.setStatus(Status.ACTIVE);
        severityLevelDTO.setCreatedAt(LocalDateTime.now());
        severityLevelDTO.setUpdatedAt(LocalDateTime.now());
        return severityLevelRepository.save(severityLevelDTO.toEntity()).getId();
    }

    @Override
    public void updateSeverityLevel(SeverityLevelDTO severityLevelDTO) throws HSException {
        SeverityLevel existingSeverityLevel = severityLevelRepository.findById(severityLevelDTO.getId())
                .orElseThrow(() -> new HSException("SEVERITY_LEVEL_NOT_FOUND"));
        if (!existingSeverityLevel.getName().equalsIgnoreCase(severityLevelDTO.getName())
                || !existingSeverityLevel.getIncidentCategory().getId()
                        .equals(severityLevelDTO.getIncidentCategoryId())) {

            Optional<SeverityLevel> optional = severityLevelRepository.findByLevelAndIncidentCategory(
                    severityLevelDTO.getLevel(),
                    severityLevelDTO.getIncidentCategoryId());
            if (optional.isPresent() && optional.get().getId() != existingSeverityLevel.getId()) {
                throw new HSException("SEVERITY_LEVEL_ALREADY_EXISTS");
            }

        }
        existingSeverityLevel.setName(severityLevelDTO.getName());
        existingSeverityLevel.setDescription(severityLevelDTO.getDescription());
        existingSeverityLevel.setIncidentCategory(severityLevelDTO.toEntity().getIncidentCategory());
        existingSeverityLevel.setUpdatedAt(LocalDateTime.now());
        severityLevelRepository.save(existingSeverityLevel);
    }

    @Override
    public void deleteSeverityLevel(Long id) {

        throw new UnsupportedOperationException("Unimplemented method 'deleteSeverityLevel'");
    }

    @Override
    public SeverityLevelDTO getSeverityLevelById(Long id) throws HSException {
        return severityLevelRepository.findById(id).map(SeverityLevel::toDTO)
                .orElseThrow(() -> new HSException("SEVERITY_LEVEL_NOT_FOUND"));
    }

    @Override
    public void activateSeverityLevel(Long id) throws HSException {
        SeverityLevel existingSeverityLevel = severityLevelRepository.findById(id)
                .orElseThrow(() -> new HSException("SEVERITY_LEVEL_NOT_FOUND"));
        existingSeverityLevel.setStatus(Status.ACTIVE);
        existingSeverityLevel.setUpdatedAt(LocalDateTime.now());
        severityLevelRepository.save(existingSeverityLevel);
    }

    @Override
    public void deactivateSeverityLevel(Long id) throws HSException {
        SeverityLevel existingSeverityLevel = severityLevelRepository.findById(id)
                .orElseThrow(() -> new HSException("SEVERITY_LEVEL_NOT_FOUND"));
        existingSeverityLevel.setStatus(Status.INACTIVE);
        existingSeverityLevel.setUpdatedAt(LocalDateTime.now());
        severityLevelRepository.save(existingSeverityLevel);
    }

    @Override
    public List<SeverityLevelDTO> getAllSeverityLevels() throws HSException {
        return ((List<SeverityLevel>) severityLevelRepository.findAll()).stream().map(SeverityLevel::toDTO)
                .toList();
    }

    @Override
    public List<SeverityLevelResponse> getAllActiveSeverityLevels() throws HSException {
        return severityLevelRepository.findAllActiveLevels();
    }

    @Override
    public List<String> addExample(SeverityLevelDTO request) throws HSException {
        SeverityLevelDTO severityLevel = severityLevelRepository.findById(request.getId())
                .orElseThrow(() -> new HSException("SEVERITY_LEVEL_NOT_FOUND")).toDTO();
        List<String> examples = severityLevel.getExamples();
        if (examples == null) {
            examples = new ArrayList<>();
        }
        examples.add(request.getExamples().get(0));
        severityLevel.setExamples(examples);
        severityLevel.setUpdatedAt(LocalDateTime.now());
        severityLevelRepository.save(severityLevel.toEntity());
        return examples;
    }

    @Override
    public void deleteExample(Long index, Long id) throws HSException {
        SeverityLevelDTO severityLevel = severityLevelRepository.findById(id)
                .orElseThrow(() -> new HSException("SEVERITY_LEVEL_NOT_FOUND")).toDTO();
        List<String> examples = severityLevel.getExamples();
        if (examples == null || index < 0 || index >= examples.size()) {
            throw new HSException("EXAMPLE_NOT_FOUND");
        }
        examples.remove(index.intValue());
        severityLevel.setExamples(examples);
        severityLevel.setUpdatedAt(LocalDateTime.now());
        severityLevelRepository.save(severityLevel.toEntity());
    }

    @Override
    public List<SeverityLevelResponse> getUniqueLevelName() throws HSException {
        return severityLevelRepository.findDistinctLevelAndName();
    }

}
