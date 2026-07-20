package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.SeverityLevelDTO;
import com.minexpert.hns.dto.response.SeverityLevelResponse;
import com.minexpert.hns.exception.HSException;

public interface SeverityLevelService {
    public Long addSeverityLevel(SeverityLevelDTO severityLevelDTO) throws HSException;

    public void updateSeverityLevel(SeverityLevelDTO severityLevelDTO) throws HSException;

    public void deleteSeverityLevel(Long id);

    public SeverityLevelDTO getSeverityLevelById(Long id) throws HSException;

    public void activateSeverityLevel(Long id) throws HSException;

    public List<SeverityLevelDTO> getAllSeverityLevels(Long companyId) throws HSException;

    public List<SeverityLevelResponse> getUniqueLevelName(Long companyId) throws HSException;

    public List<SeverityLevelResponse> getAllActiveSeverityLevels(Long companyId) throws HSException;

    public void deactivateSeverityLevel(Long id) throws HSException;

    public List<String> addExample(SeverityLevelDTO request) throws HSException;

    public void deleteExample(Long index, Long id) throws HSException;
}
