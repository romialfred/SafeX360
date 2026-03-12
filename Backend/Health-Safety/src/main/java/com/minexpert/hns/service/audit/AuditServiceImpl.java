package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.AuditDTO;
import com.minexpert.hns.dto.audit.AuditDetails;
import com.minexpert.hns.dto.audit.AuditRequest;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditRepository auditRepository;
    private final AuditorService auditorService;

    private final ContributorService contributorService;

    @Override
    public Long createAudit(AuditDTO auditDTO) throws HSException {
        auditDTO.setRefNumber(generateAuditRefNumber());
        auditDTO.setStatus(AuditStatus.PLANNING);
        auditDTO.setCreatedAt(LocalDateTime.now());
        auditDTO.setUpdatedAt(LocalDateTime.now());
        return auditRepository.save(auditDTO.toEntity()).getId();

    }

    @Override
    public void updateAudit(AuditDTO auditDTO) throws HSException {
        Audit audit = auditRepository.findById(auditDTO.getId())
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        auditRepository.save(audit.update(auditDTO));
    }

    @Override
    public AuditDTO getAudit(Long id) throws HSException {
        return auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND")).toDTO();
    }

    @Override
    public Long createAudit(AuditRequest request) throws HSException {
        Long auditId = this.createAudit(request.getAudit());
        auditorService.addAuditors(request.getAuditors(), auditId);
        return auditId;
    }

    @Override
    public void updateAudit(AuditRequest request) throws HSException {
        this.updateAudit(request.getAudit());
        auditorService.addOrUpdateAuditors(request.getAuditors(), request.getAudit().getId());

    }

    @Override
    public List<AuditDTO> getAllAudits() throws HSException {
        return ((List<Audit>) auditRepository.findAll()).stream()
                .filter((x) -> x.getPlanningStatus() == null || x.getPlanningStatus() == PlanningStatus.APPROVED)
                .map(Audit::toDTO)
                .toList();
    }

    @Override
    public void executeAudit(ExecuteRequest request) throws HSException {
        // reportService.createReport(request.getReport());
        contributorService.createContributors(request.getContributors());
    }

    @Override
    public AuditDetails getAuditDetails(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        return audit.toDTO().toDetails();
    }

    private String generateAuditRefNumber() {
        int currentYear = Year.now().getValue();

        // Fetch last incident for the current year
        Pageable limitOne = PageRequest.of(0, 1);
        List<Audit> latestAudits = auditRepository.findTopByYearOrderByIdDesc(currentYear, limitOne);

        int nextNumber = 1;
        if (!latestAudits.isEmpty()) {
            String lastNumber = latestAudits.get(0).getRefNumber(); // INC-2025-000123
            if (lastNumber != null) {
                String[] parts = lastNumber.split("-");
                if (parts.length == 3) {
                    nextNumber = Integer.parseInt(parts[2]) + 1;
                }
            }
        }

        return String.format("AUD-%d-%03d", currentYear, nextNumber);
    }

    @Override
    public void updateAuditStatus(Long id, AuditStatus status) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setStatus(status);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

    @Override
    public List<AuditDTO> getAllPlanningAudits() throws HSException {
        return auditRepository.findAllWithNonNullPlanningStatus().stream().map(Audit::toDTO).toList();
    }

    @Override
    public void approvePlanning(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setPlanningStatus(PlanningStatus.APPROVED);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

    @Override
    public void rejectPlanning(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setPlanningStatus(PlanningStatus.REJECTED);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

}
