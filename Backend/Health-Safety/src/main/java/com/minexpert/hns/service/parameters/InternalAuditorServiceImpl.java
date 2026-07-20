package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.InternalAuditorDTO;
import com.minexpert.hns.dto.parameters.InternalAuditorResponse;
import com.minexpert.hns.dto.request.EmployeeDirection;
import com.minexpert.hns.entity.parameters.InternalAuditor;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.InternalAuditorRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class InternalAuditorServiceImpl implements InternalAuditorService {
    private final InternalAuditorRepository internalAuditorRepository;
    private final HrmsClient hrmsClient;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    /**
     * Mine effective pour une opération sur une entité EXISTANTE. Le paramètre
     * {@code companyId} prime s'il désigne une mine précise (utilisateur cloisonné) ;
     * sinon (admin « Toutes les Mines » en vue consolidée) on DÉRIVE la mine de l'entité.
     */
    private Long resolveOwningCompany(Long companyId, InternalAuditor existing) throws HSException {
        Long effective = (companyId != null && companyId > 0) ? companyId : existing.getCompanyId();
        if (effective == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (!effective.equals(existing.getCompanyId())) {
            throw new HSException("INTERNAL_AUDITOR_NOT_FOUND");
        }
        return effective;
    }

    private InternalAuditor loadInternalAuditor(Long companyId, Long id) throws HSException {
        return internalAuditorRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INTERNAL_AUDITOR_NOT_FOUND"));
    }

    @Override
    @CacheEvict(cacheNames = "internalAuditorsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public Long createInternalAuditor(Long companyId, InternalAuditorDTO internalAuditorDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<InternalAuditor> optional = internalAuditorRepository
                .findByCompanyIdAndEmployeeId(companyId, internalAuditorDTO.getEmployeeId());
        if (optional.isPresent()) {
            throw new HSException("INTERNAL_AUDITOR_ALREADY_EXISTS");
        }

        internalAuditorDTO.setCompanyId(companyId);
        internalAuditorDTO.setCreatedAt(LocalDateTime.now());
        internalAuditorDTO.setUpdatedAt(LocalDateTime.now());
        internalAuditorDTO.setStatus(Status.ACTIVE);

        return internalAuditorRepository.save(internalAuditorDTO.toEntity()).getId();
    }

    @Override
    @CacheEvict(cacheNames = "internalAuditorsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public void updateInternalAuditor(Long companyId, InternalAuditorDTO internalAuditorDTO) throws HSException {
        InternalAuditor internalAuditor;
        if (internalAuditorDTO.getId() != null) {
            internalAuditor = loadInternalAuditor(companyId, internalAuditorDTO.getId());
        } else {
            internalAuditor = internalAuditorRepository
                    .findByCompanyIdAndEmployeeId(companyId, internalAuditorDTO.getEmployeeId())
                    .orElseThrow(() -> new HSException("INTERNAL_AUDITOR_NOT_FOUND"));
        }
        companyId = resolveOwningCompany(companyId, internalAuditor);

        if (!internalAuditor.getEmployeeId().equals(internalAuditorDTO.getEmployeeId())) {
            Optional<InternalAuditor> existing = internalAuditorRepository
                    .findByCompanyIdAndEmployeeId(companyId, internalAuditorDTO.getEmployeeId());
            if (existing.isPresent()) {
                throw new HSException("INTERNAL_AUDITOR_ALREADY_EXISTS");
            }
            internalAuditor.setEmployeeId(internalAuditorDTO.getEmployeeId());
        }

        internalAuditor.setRole(internalAuditorDTO.getRole());
        internalAuditor.setStatus(internalAuditorDTO.getStatus());
        internalAuditor.setCompanyId(companyId);

        // LOT 52 : champs compétences (ISO 19011 §7) — mis à jour seulement si
        // fournis pour ne pas écraser les valeurs existantes avec un payload legacy.
        if (internalAuditorDTO.getQualifications() != null) {
            internalAuditor.setQualifications(internalAuditorDTO.getQualifications());
        }
        if (internalAuditorDTO.getDomains() != null) {
            internalAuditor.setDomains(internalAuditorDTO.getDomains());
        }
        if (internalAuditorDTO.getLanguages() != null) {
            internalAuditor.setLanguages(internalAuditorDTO.getLanguages());
        }
        if (internalAuditorDTO.getLeadQualified() != null) {
            internalAuditor.setLeadQualified(internalAuditorDTO.getLeadQualified());
        }
        if (internalAuditorDTO.getDepartmentId() != null) {
            internalAuditor.setDepartmentId(internalAuditorDTO.getDepartmentId());
        }
        if (internalAuditorDTO.getLastEvaluationDate() != null) {
            internalAuditor.setLastEvaluationDate(internalAuditorDTO.getLastEvaluationDate());
        }
        if (internalAuditorDTO.getLastEvaluationScore() != null) {
            internalAuditor.setLastEvaluationScore(internalAuditorDTO.getLastEvaluationScore());
        }

        internalAuditor.setUpdatedAt(LocalDateTime.now());

        internalAuditorRepository.save(internalAuditor);
    }

    @Override
    @CacheEvict(cacheNames = "internalAuditorsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public void activateInternalAuditor(Long companyId, Long id) throws HSException {
        InternalAuditor internalAuditor = loadInternalAuditor(companyId, id);
        internalAuditor.setStatus(Status.ACTIVE);
        internalAuditor.setUpdatedAt(LocalDateTime.now());

        internalAuditorRepository.save(internalAuditor);
    }

    @Override
    @CacheEvict(cacheNames = "internalAuditorsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public void deactivateInternalAuditor(Long companyId, Long id) throws HSException {
        InternalAuditor internalAuditor = loadInternalAuditor(companyId, id);
        internalAuditor.setStatus(Status.INACTIVE);
        internalAuditor.setUpdatedAt(LocalDateTime.now());

        internalAuditorRepository.save(internalAuditor);
    }

    @Override
    @Cacheable(cacheNames = "internalAuditorsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<InternalAuditorResponse> getAllInternalAuditors(Long companyId) throws HSException {
        List<InternalAuditor> auditors = internalAuditorRepository.findAllWithCompany(companyId);
        List<Long> employeeIds = auditors.stream()
                .map(InternalAuditor::getEmployeeId)
                .distinct()
                .toList();

        Map<Long, EmployeeDirection> directMap = employeeIds.isEmpty()
                ? Map.of()
                : hrmsClient.getEmployeeWithDirection(employeeIds).stream()
                        .collect(Collectors.toMap(EmployeeDirection::getId, Function.identity()));
        return auditors.stream()
                .map(auditor -> {
                    EmployeeDirection direction = directMap.get(auditor.getEmployeeId());
                    return new InternalAuditorResponse(auditor.getId(), auditor.getEmployeeId(), auditor.getCompanyId(),
                            direction != null ? direction.getName() : null,
                            direction != null ? direction.getEmail() : null,
                            direction != null ? direction.getDepartment() : null,
                            direction != null ? direction.getDirection() : null,
                            auditor.getRole(),
                            auditor.getStatus(),
                            auditor.getCreatedAt(),
                            auditor.getUpdatedAt(),
                            auditor.getQualifications(),
                            auditor.getDomains(),
                            auditor.getLanguages(),
                            auditor.getLeadQualified(),
                            auditor.getDepartmentId(),
                            auditor.getLastEvaluationDate(),
                            auditor.getLastEvaluationScore());
                })
                .toList();

    }

}
