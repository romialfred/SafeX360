package com.minexpert.hns.service.users;

import com.minexpert.hns.dto.users.PermissionManagementDTO;
import com.minexpert.hns.entity.users.PermissionManagement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.users.PermissionManagementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionManagementServiceImpl implements PermissionManagementService {
    private final PermissionManagementRepository repository;

    @Override
    public PermissionManagementDTO create(PermissionManagementDTO dto) throws HSException {
        PermissionManagement entity = dto.toEntity();
        PermissionManagement saved = repository.save(entity);
        return saved.toDTO();
    }

    @Override
    public PermissionManagementDTO update(PermissionManagementDTO dto) throws HSException {
        PermissionManagement existing = repository.findById(dto.getId())
                .orElseThrow(() -> new HSException("PERMISSION_NOT_FOUND"));
        // Overwrite all mutable fields from DTO
        existing.setEmployeeId(dto.getEmployeeId());
        existing.setStatus(dto.getStatus());
        existing.setRole(dto.getRole());
        existing.setNonConformity(dto.getNonConformity());
        existing.setInspections(dto.getInspections());
        existing.setMeetings(dto.getMeetings());
        existing.setManagementTour(dto.getManagementTour());
        existing.setPpeOverview(dto.getPpeOverview());
        existing.setPpeMonitoring(dto.getPpeMonitoring());
        existing.setPpeRequest(dto.getPpeRequest());
        existing.setIncidentManagement(dto.getIncidentManagement());
        existing.setInvestigations(dto.getInvestigations());
        existing.setActionPlansInc(dto.getActionPlansInc());
        existing.setPendingActions(dto.getPendingActions());
        existing.setActionPlan(dto.getActionPlan());
        existing.setRecommendations(dto.getRecommendations());
        existing.setAdhocActions(dto.getAdhocActions());
        existing.setAuditPlan(dto.getAuditPlan());
        existing.setAudits(dto.getAudits());
        existing.setAuditRecommendations(dto.getAuditRecommendations());
        existing.setComplianceDashboard(dto.getComplianceDashboard());
        existing.setRequirements(dto.getRequirements());
        existing.setPositionAssignments(dto.getPositionAssignments());
        existing.setEmployeeAssignments(dto.getEmployeeAssignments());
        existing.setRiskOverview(dto.getRiskOverview());
        existing.setRiskRegister(dto.getRiskRegister());
        existing.setRiskAssessment(dto.getRiskAssessment());
        existing.setChemicalRegister(dto.getChemicalRegister());
        existing.setDocuments(dto.getDocuments());
        existing.setDocumentValidation(dto.getDocumentValidation());
        existing.setLessonsLearned(dto.getLessonsLearned());
        existing.setDocumentManager(dto.getDocumentManager());
        existing.setHome(dto.getHome());
        existing.setCommDashboard(dto.getCommDashboard());
        existing.setEmployeeComm(dto.getEmployeeComm());
        existing.setNotifications(dto.getNotifications());
        existing.setUsersManagement(dto.getUsersManagement());
        existing.setSettings(dto.getSettings());
        PermissionManagement updated = repository.save(existing);
        return updated.toDTO();
    }

    @Override
    public PermissionManagementDTO updateStatus(Long id, Status status) throws HSException {
        PermissionManagement entity = repository.findById(id)
                .orElseThrow(() -> new HSException("PERMISSION_NOT_FOUND"));
        entity.setStatus(status);
        PermissionManagement updated = repository.save(entity);
        return updated.toDTO();
    }

    @Override
    public PermissionManagementDTO getById(Long id) throws HSException {
        PermissionManagement entity = repository.findById(id)
                .orElseThrow(() -> new HSException("PERMISSION_NOT_FOUND"));
        return entity.toDTO();
    }

    @Override
    public List<PermissionManagementDTO> getAll() throws HSException {
        return repository.findAll().stream().map(PermissionManagement::toDTO).toList();
    }

    @Override
    public PermissionManagementDTO getByEmployeeId(Long employeeId) throws HSException {
        PermissionManagement entity = repository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new HSException("PERMISSION_NOT_FOUND"));
        return entity.toDTO();
    }

    @Override
    public List<Long> getRegisteredEmployeeIds() throws HSException {
        return repository.findDistinctEmployeeIds();
    }
}
