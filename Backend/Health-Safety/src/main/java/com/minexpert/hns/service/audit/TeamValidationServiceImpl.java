package com.minexpert.hns.service.audit;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.ValidateTeamRequest;
import com.minexpert.hns.dto.audit.ValidateTeamResponse;
import com.minexpert.hns.entity.parameters.AuditorCertification;
import com.minexpert.hns.entity.parameters.InternalAuditor;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.AuditorCertificationRepository;
import com.minexpert.hns.repository.parameters.InternalAuditorRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Implémentation de la validation d'équipe d'audit (ISO 19011:2026).
 *
 * <p>Ne lève pas d'exception en cas de violation : retourne la liste complète
 * des écarts en français pour affichage côté client.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TeamValidationServiceImpl implements TeamValidationService {

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InternalAuditorRepository internalAuditorRepository;
    private final AuditorCertificationRepository certificationRepository;

    @Override
    public ValidateTeamResponse validateTeam(ValidateTeamRequest request) throws HSException {
        if (request == null || request.getLeadEmployeeId() == null) {
            throw new HSException("VALIDATE_TEAM_LEAD_REQUIRED");
        }
        List<String> violations = new ArrayList<>();
        List<Long> auditedDepartments = request.getAuditedDepartmentIds() != null
                ? request.getAuditedDepartmentIds()
                : List.of();

        // (a) Qualification lead du responsable d'audit.
        Optional<InternalAuditor> leadOpt = findAuditor(request.getLeadEmployeeId(), request.getCompanyId());
        if (leadOpt.isEmpty()) {
            violations.add(String.format(
                    "Le responsable d'audit (employé %d) n'est pas enregistré comme auditeur interne.",
                    request.getLeadEmployeeId()));
        } else if (!Boolean.TRUE.equals(leadOpt.get().getLeadQualified())) {
            violations.add(String.format(
                    "Le responsable d'audit (employé %d) n'est pas qualifié responsable d'équipe d'audit "
                            + "(lead auditor) au sens de l'ISO 19011 §7.",
                    request.getLeadEmployeeId()));
        }

        // (b) Indépendance : aucun membre de l'équipe (lead inclus) ne doit
        // appartenir à un département audité.
        Set<Long> teamEmployeeIds = new LinkedHashSet<>();
        teamEmployeeIds.add(request.getLeadEmployeeId());
        if (request.getAuditorEmployeeIds() != null) {
            teamEmployeeIds.addAll(request.getAuditorEmployeeIds());
        }
        for (Long employeeId : teamEmployeeIds) {
            if (employeeId == null) {
                continue;
            }
            Optional<InternalAuditor> auditorOpt = findAuditor(employeeId, request.getCompanyId());
            if (auditorOpt.isEmpty()) {
                if (!employeeId.equals(request.getLeadEmployeeId())) {
                    violations.add(String.format(
                            "L'auditeur (employé %d) n'est pas enregistré comme auditeur interne.", employeeId));
                }
                continue;
            }
            InternalAuditor auditor = auditorOpt.get();
            if (auditor.getDepartmentId() != null && auditedDepartments.contains(auditor.getDepartmentId())) {
                violations.add(String.format(
                        "L'auditeur (employé %d) appartient au département audité (id %d) : "
                                + "l'indépendance exigée par l'ISO 19011 §4 n'est pas respectée.",
                        employeeId, auditor.getDepartmentId()));
            }
        }

        // (c) Certifications du responsable d'audit non expirées.
        if (leadOpt.isPresent()) {
            LocalDate today = LocalDate.now();
            List<AuditorCertification> certifications = certificationRepository
                    .findByInternalAuditorIdOrderByExpiryDateAsc(leadOpt.get().getId());
            for (AuditorCertification certification : certifications) {
                if (certification.getExpiryDate() != null && certification.getExpiryDate().isBefore(today)) {
                    violations.add(String.format(
                            "La certification « %s » du responsable d'audit a expiré le %s.",
                            certification.getName(),
                            certification.getExpiryDate().format(DATE_FR)));
                }
            }
        }

        return new ValidateTeamResponse(violations.isEmpty(), violations);
    }

    private Optional<InternalAuditor> findAuditor(Long employeeId, Long companyId) {
        if (companyId != null) {
            return internalAuditorRepository.findByCompanyIdAndEmployeeId(companyId, employeeId);
        }
        return internalAuditorRepository.findFirstByEmployeeIdOrderByIdDesc(employeeId);
    }
}
