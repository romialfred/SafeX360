package com.minexpert.hns.service.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.config.ComplianceCacheNames;
import com.minexpert.hns.dto.compliance.ComplianceDocsDTO;
import com.minexpert.hns.dto.compliance.DocResponse;
import com.minexpert.hns.dto.compliance.EmpAssignResponse;
import com.minexpert.hns.dto.compliance.PosRequirement;
import com.minexpert.hns.dto.compliance.ReqResponse;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.compliance.ComplianceDocs;
import com.minexpert.hns.enums.DocStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.ComplianceDocsRepository;
import com.minexpert.hns.service.MediaService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ComplianceDocsServiceImpl implements ComplianceDocsService {

    private final ComplianceDocsRepository complianceDocsRepository;

    private final HrmsClient hrmsClient;
    private final PositionAssignmentService positionAssignmentService;
    private final MediaService mediaService;

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS,
            ComplianceCacheNames.DOCS_ALL,
            ComplianceCacheNames.DOCS_BY_EMPLOYEE,
            ComplianceCacheNames.DOC_DETAILS,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.EMPLOYEE_EMAIL_POSITIONS
    }, allEntries = true)
    public Long saveComplianceDoc(ComplianceDocsDTO complianceDocsDTO) throws HSException {
        Optional<ComplianceDocs> existingDoc = complianceDocsRepository
                .findByEmployeeIdAndRequirementIdAndStatusNotAndExpiryDateAfter(complianceDocsDTO.getEmployeeId(),
                        complianceDocsDTO.getRequirementId(), DocStatus.INVALID, LocalDate.now());
        if (existingDoc.isPresent()) {
            throw new HSException("DOCUMENT_ALREADY_EXISTS_FOR_EMPLOYEE");
        }
        complianceDocsDTO.getMedia().setId(
                mediaService.saveMedia(complianceDocsDTO.getMedia()));
        complianceDocsDTO.setCreatedAt(LocalDateTime.now());
        complianceDocsDTO.setUpdatedAt(LocalDateTime.now());
        complianceDocsDTO.setStatus(DocStatus.PENDING);
        complianceDocsDTO.setComment(null);
        return complianceDocsRepository.save(complianceDocsDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.DOCS_ALL)
    public List<DocResponse> getAllComplianceDocs() throws HSException {
        List<DocResponse> docs = complianceDocsRepository.findAllDocs();
        List<Long> employeeIds = docs.stream().map(DocResponse::getEmployeeId).filter(Objects::nonNull)
                .distinct()
                .toList();
        if (employeeIds.isEmpty()) {
            return docs; // No employee IDs to fetch names for
        }
        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(employeeIds);
        Map<Long, String> employeeIdToNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        docs.forEach(doc -> {
            if (doc.getEmployeeId() != null) {
                doc.setUploadedBy(employeeIdToNameMap.get(doc.getEmployeeId()));
            }
        });
        return docs;
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.EMPLOYEE_EMAIL_POSITIONS)
    public List<EmpEmailPosResponse> getAllEmpEmailPos() throws HSException {
        List<EmpEmailPosResponse> empEmailPosResponses = hrmsClient.getAllEmployeesWithEmailAndPosition();
        List<Long> positionIds = empEmailPosResponses.stream()
                .map(EmpEmailPosResponse::getPositionId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<PosRequirement> posRequirements = positionAssignmentService.getRequirementIdsByPositionIds(positionIds);
        Map<Long, List<Long>> positionIdToRequirementsMap = posRequirements.stream()
                .collect(Collectors.toMap(PosRequirement::getPositionId, PosRequirement::getRequirementIds));
        return empEmailPosResponses.stream()
                .filter(emp -> {
                    List<Long> reqIds = positionIdToRequirementsMap.get(emp.getPositionId());
                    return reqIds != null && !reqIds.isEmpty();
                })
                .map(emp -> {
                    List<Long> requirementIds = positionIdToRequirementsMap.get(emp.getPositionId());
                    emp.setStatus(findEmpStatus(emp.getId(), requirementIds));
                    return emp;
                }).toList();
    }

    public String findEmpStatus(Long empId, List<Long> requirementIds) {
        if (requirementIds == null || requirementIds.isEmpty()) {
            return "Non-Compliance"; // No requirements assigned
        }
        List<ComplianceDocs> docs = complianceDocsRepository.findByEmployeeIdAndRequirementIdIn(empId, requirementIds);

        Map<Long, ComplianceDocs> latestDocsByRequirement = docs.stream()
                .collect(Collectors.toMap(
                        doc -> doc.getRequirement().getId(),
                        doc -> doc,
                        (doc1, doc2) -> doc1.getCreatedAt().isAfter(doc2.getCreatedAt()) ? doc1 : doc2 // Pick latest
                ));
        String status = "Compliance"; // Default status
        for (Long reqId : requirementIds) {
            ComplianceDocs doc = latestDocsByRequirement.get(reqId);

            if (doc == null) {
                return "Non-Compliance"; // Missing document
            }

            if (doc.getStatus() == DocStatus.INVALID ||
                    doc.getExpiryDate() != null && doc.getExpiryDate().isBefore(LocalDate.now())) {
                return "Non-Compliance"; // Expired or Invalid
            }

            if (doc.getStatus() == DocStatus.PENDING) {
                status = "Uploaded";
            }
        }

        return status;
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.DOCS_BY_EMPLOYEE, key = "#employeeId")
    public List<DocResponse> getComplianceDocsByEmployeeId(Long employeeId) throws HSException {
        List<DocResponse> res = complianceDocsRepository.findAllDocsByEmpId(employeeId);
        List<Long> employeeIds = res.stream().map(DocResponse::getEmployeeId).filter(Objects::nonNull)
                .distinct()
                .toList();
        if (employeeIds.isEmpty()) {
            return res; // No employee IDs to fetch names for
        }
        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(employeeIds);
        Map<Long, String> employeeIdToNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        res.forEach(doc -> {
            if (doc.getEmployeeId() != null) {
                doc.setUploadedBy(employeeIdToNameMap.get(doc.getEmployeeId()));
            }
        });
        return res;
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE, key = "#employeeId")
    public EmpAssignResponse getRequirementsByEmpId(Long employeeId) throws HSException {
        EmpEmailPosResponse empEmailPosResponse = hrmsClient.getEmployeeWithEmailAndPositionById(employeeId);
        List<ReqResponse> req = positionAssignmentService
                .getRequiremenDetailsByPositionId(empEmailPosResponse.getPositionId());

        for (ReqResponse requirement : req) {
            List<ComplianceDocs> docs = complianceDocsRepository
                    .findByEmployeeIdAndRequirementId(employeeId, requirement.getRequirementId());
            if (docs.isEmpty()) {
                requirement.setStatus("Non-Compliance");
            } else {
                ComplianceDocs latestDoc = docs.stream()
                        .max((d1, d2) -> d1.getCreatedAt().compareTo(d2.getCreatedAt())).orElse(null);

                if (latestDoc == null || latestDoc.getStatus() == DocStatus.INVALID ||
                        (latestDoc.getExpiryDate() != null && latestDoc.getExpiryDate().isBefore(LocalDate.now()))) {
                    requirement.setStatus("Non-Compliance");
                } else if (latestDoc.getStatus() == DocStatus.PENDING) {
                    requirement.setStatus("Uploaded");
                } else {
                    requirement.setStatus("Compliance");
                }
                if (latestDoc != null) {
                    requirement.setDocId(latestDoc.getId());
                    requirement.setUpdatedAt(latestDoc.getUpdatedAt());
                    requirement.setExpiryDate(latestDoc.getExpiryDate());
                }
            }
        }
        return new EmpAssignResponse(empEmailPosResponse.getName(), empEmailPosResponse.getPosition(),
                empEmailPosResponse.getDepartment(),
                empEmailPosResponse.getEmail(), req);

    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.DOC_DETAILS, key = "#id")
    public DocResponse getDocDetails(Long id) throws HSException {
        DocResponse doc = complianceDocsRepository.findDocById(id)
                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
        EmpEmailPosResponse emp = hrmsClient.getEmployeeWithEmailAndPositionById(doc.getEmployeeId());
        doc.setUploadedBy(emp.getName());
        return doc;
    }

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS,
            ComplianceCacheNames.DOCS_ALL,
            ComplianceCacheNames.DOCS_BY_EMPLOYEE,
            ComplianceCacheNames.DOC_DETAILS,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.EMPLOYEE_EMAIL_POSITIONS
    }, allEntries = true)
    public void approveComplianceDoc(Long id) throws HSException {
        ComplianceDocs complianceDoc = complianceDocsRepository.findById(id)
                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
        if (complianceDoc.getStatus() == DocStatus.PENDING) {
            complianceDoc.setStatus(DocStatus.VALID);
            complianceDoc.setUpdatedAt(LocalDateTime.now());
            complianceDocsRepository.save(complianceDoc);
        } else {
            throw new HSException("DOCUMENT_ALREADY_APPROVED_OR_REJECTED");
        }
    }

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS,
            ComplianceCacheNames.DOCS_ALL,
            ComplianceCacheNames.DOCS_BY_EMPLOYEE,
            ComplianceCacheNames.DOC_DETAILS,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.EMPLOYEE_EMAIL_POSITIONS
    }, allEntries = true)
    public void rejectComplianceDoc(Long id, String comment) throws HSException {
        ComplianceDocs complianceDoc = complianceDocsRepository.findById(id)
                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
        if (complianceDoc.getStatus() == DocStatus.PENDING) {
            complianceDoc.setStatus(DocStatus.INVALID);
            complianceDoc.setComment(comment);
            complianceDoc.setUpdatedAt(LocalDateTime.now());
            complianceDocsRepository.save(complianceDoc);
        } else {
            throw new HSException("DOCUMENT_ALREADY_APPROVED_OR_REJECTED");
        }
    }

}
