package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.AuditAreasDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.AuditAreasRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditAreasServiceImpl implements AuditAreasService {

    private final AuditAreasRepository auditAreasRepository;
    private final HrmsClient hrmsClient;

    @Override
    public Long addAuditArea(AuditAreasDTO auditAreasDTO) throws HSException {
        Optional<AuditAreas> opt = auditAreasRepository.findByNameIgnoreCase(auditAreasDTO.getName());
        if (opt.isPresent()) {
            throw new HSException("AUDIT_AREA_NAME_ALREADY_EXISTS");
        }
        auditAreasDTO.setStatus(Status.ACTIVE);
        auditAreasDTO.setCreatedAt(LocalDateTime.now());
        auditAreasDTO.setUpdatedAt(LocalDateTime.now());
        return auditAreasRepository.save(auditAreasDTO.toEntity()).getId();

    }

    @Override
    public void deleteAuditArea(Long id) {
        auditAreasRepository.deleteById(id);
    }

    @Override
    public AuditAreasDTO getAuditAreaById(Long id) throws HSException {
        return auditAreasRepository.findById(id).map(AuditAreas::toDTO)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
    }

    @Override
    public List<AuditAreasDTO> getAllAuditAreas() {
        List<AuditAreasDTO> areas = ((List<AuditAreas>) auditAreasRepository.findAll())
                .stream()
                .map(AuditAreas::toDTO)
                .toList();
        populateOwnerNames(areas);
        return areas;
    }

    @Override
    public List<AuditAreasDTO> getAllActiveAuditAreas() {
        List<AuditAreasDTO> areas = ((List<AuditAreas>) auditAreasRepository.findByStatus(Status.ACTIVE))
                .stream()
                .map(AuditAreas::toDTO)
                .toList();
        populateOwnerNames(areas);
        return areas;
    }

    private void populateOwnerNames(List<AuditAreasDTO> areas) {
        List<Long> empIds = areas.stream()
                .map(AuditAreasDTO::getOwner)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToName = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        areas.forEach(area -> {
            if (area.getOwner() != null) {
                area.setOwnerName(empIdToName.get(area.getOwner()));
            }
        });
    }

    @Override
    public void activateAuditArea(Long id) throws HSException {
        AuditAreas auditAreas = auditAreasRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        auditAreas.setStatus(Status.ACTIVE);
        auditAreas.setUpdatedAt(LocalDateTime.now());
        auditAreasRepository.save(auditAreas);
    }

    @Override
    public void deactivateAuditArea(Long id) throws HSException {
        AuditAreas auditAreas = auditAreasRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        auditAreas.setStatus(Status.INACTIVE);
        auditAreas.setUpdatedAt(LocalDateTime.now());
        auditAreasRepository.save(auditAreas);
    }

    @Override
    public void updateAuditArea(AuditAreasDTO auditAreasDTO) throws HSException {
        AuditAreas auditAreas = auditAreasRepository.findById(auditAreasDTO.getId())
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        if (!auditAreas.getName().equalsIgnoreCase(auditAreasDTO.getName())) {
            Optional<AuditAreas> opt = auditAreasRepository.findByNameIgnoreCase(auditAreasDTO.getName());
            if (opt.isPresent()) {
                throw new HSException("AUDIT_AREA_NAME_ALREADY_EXISTS");
            }
        }
        auditAreas.setName(auditAreasDTO.getName());
        auditAreas.setUpdatedAt(LocalDateTime.now());
        auditAreasRepository.save(auditAreas);
    }

}
