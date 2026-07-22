package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.InvestigationTimelineEventDTO;
import com.minexpert.hns.dto.WitnessStatementDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.entity.incident.InvestigationTimelineEvent;
import com.minexpert.hns.entity.incident.WitnessStatement;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.repository.incident.InvestigationTimelineEventRepository;
import com.minexpert.hns.repository.incident.WitnessStatementRepository;
import com.minexpert.hns.utility.AuthUtils;

import lombok.RequiredArgsConstructor;

/**
 * Frise chronologique (ECFC) + témoignages structurés — cloisonnés par mine via
 * l'enquête parente. company_id estampillé depuis l'enquête (source de vérité),
 * jamais depuis le client (cohérent avec le reste du HNS).
 */
@Service
@RequiredArgsConstructor
public class InvestigationGovernanceServiceImpl implements InvestigationGovernanceService {

    private final InvestigationRepository investigationRepository;
    private final InvestigationTimelineEventRepository timelineRepository;
    private final WitnessStatementRepository witnessRepository;
    private final HrmsClient hrmsClient;

    /** Charge l'enquête en respectant le cloisonnement (companyId nul = consolidé). */
    private Investigation requireInvestigation(Long companyId, Long investigationId) throws HSException {
        return investigationRepository.findByIdWithCompanyContext(investigationId, companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
    }

    /** Vérifie qu'une entité enfant appartient bien à la mine demandée. */
    private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
        if (companyId != null && entityCompanyId != null && !companyId.equals(entityCompanyId)) {
            throw new HSException("INVESTIGATION_NOT_FOUND");
        }
    }

    // ── Frise chronologique (ECFC) ───────────────────────────────────────────

    @Override
    public InvestigationTimelineEventDTO addTimelineEvent(Long companyId, Long investigationId,
            InvestigationTimelineEventDTO dto) throws HSException {
        Investigation investigation = requireInvestigation(companyId, investigationId);
        if (dto == null || dto.getDescription() == null || dto.getDescription().isBlank()) {
            throw new HSException("TIMELINE_DESCRIPTION_REQUIRED");
        }
        InvestigationTimelineEvent e = new InvestigationTimelineEvent();
        e.setInvestigationId(investigationId);
        e.setOccurredAt(dto.getOccurredAt());
        e.setSequenceOrder(dto.getSequenceOrder());
        e.setEventType(dto.getEventType());
        e.setDescription(dto.getDescription().trim());
        e.setBarrierFailed(dto.getBarrierFailed());
        e.setCompanyId(investigation.getCompanyId());
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return InvestigationTimelineEventDTO.fromEntity(timelineRepository.save(e));
    }

    @Override
    public List<InvestigationTimelineEventDTO> listTimelineEvents(Long companyId, Long investigationId)
            throws HSException {
        requireInvestigation(companyId, investigationId);
        return timelineRepository
                .findByInvestigationIdOrderByOccurredAtAscSequenceOrderAsc(investigationId).stream()
                .map(InvestigationTimelineEventDTO::fromEntity).collect(Collectors.toList());
    }

    @Override
    public void deleteTimelineEvent(Long companyId, Long eventId) throws HSException {
        InvestigationTimelineEvent e = timelineRepository.findById(eventId)
                .orElseThrow(() -> new HSException("TIMELINE_EVENT_NOT_FOUND"));
        assertSameCompany(companyId, e.getCompanyId());
        timelineRepository.delete(e);
    }

    // ── Témoignages ──────────────────────────────────────────────────────────

    @Override
    public WitnessStatementDTO addWitnessStatement(Long companyId, Long investigationId,
            WitnessStatementDTO dto) throws HSException {
        Investigation investigation = requireInvestigation(companyId, investigationId);
        if (dto == null || dto.getStatement() == null || dto.getStatement().isBlank()) {
            throw new HSException("WITNESS_STATEMENT_REQUIRED");
        }
        WitnessStatement w = new WitnessStatement();
        w.setInvestigationId(investigationId);
        w.setWitnessEmployeeId(dto.getWitnessEmployeeId());
        w.setWitnessName(dto.getWitnessName());
        w.setWitnessRole(dto.getWitnessRole());
        w.setStatement(dto.getStatement().trim());
        w.setTakenAt(dto.getTakenAt() != null ? dto.getTakenAt() : LocalDateTime.now());
        // Recueilli PAR l'utilisateur authentifié (empId non répudiable, §7.5.3).
        w.setTakenBy(AuthUtils.currentEmpId());
        w.setCompanyId(investigation.getCompanyId());
        w.setCreatedAt(LocalDateTime.now());
        w.setUpdatedAt(LocalDateTime.now());
        return enrichName(WitnessStatementDTO.fromEntity(witnessRepository.save(w)));
    }

    @Override
    public List<WitnessStatementDTO> listWitnessStatements(Long companyId, Long investigationId)
            throws HSException {
        requireInvestigation(companyId, investigationId);
        List<WitnessStatementDTO> result = witnessRepository
                .findByInvestigationIdOrderByTakenAtAsc(investigationId).stream()
                .map(WitnessStatementDTO::fromEntity).collect(Collectors.toList());
        // Résolution best-effort des noms d'employés témoins (batch).
        List<Long> empIds = result.stream().map(WitnessStatementDTO::getWitnessEmployeeId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        if (!empIds.isEmpty()) {
            try {
                List<EmployeeNameDTO> names = hrmsClient.getEmployeeNameByIds(empIds);
                if (names != null) {
                    Map<Long, String> byId = names.stream()
                            .filter(n -> n.getId() != null && n.getName() != null)
                            .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName, (a, b) -> a));
                    result.forEach(d -> {
                        if (d.getWitnessEmployeeId() != null) {
                            d.setWitnessEmployeeName(byId.get(d.getWitnessEmployeeId()));
                        }
                    });
                }
            } catch (Exception ignore) {
                // best-effort : l'absence de nom ne casse pas la lecture des témoignages.
            }
        }
        return result;
    }

    @Override
    public void deleteWitnessStatement(Long companyId, Long statementId) throws HSException {
        WitnessStatement w = witnessRepository.findById(statementId)
                .orElseThrow(() -> new HSException("WITNESS_STATEMENT_NOT_FOUND"));
        assertSameCompany(companyId, w.getCompanyId());
        witnessRepository.delete(w);
    }

    private WitnessStatementDTO enrichName(WitnessStatementDTO d) {
        if (d.getWitnessEmployeeId() != null) {
            try {
                List<EmployeeNameDTO> ns = hrmsClient.getEmployeeNameByIds(List.of(d.getWitnessEmployeeId()));
                if (ns != null && !ns.isEmpty() && ns.get(0) != null) {
                    d.setWitnessEmployeeName(ns.get(0).getName());
                }
            } catch (Exception ignore) {
                // best-effort
            }
        }
        return d;
    }
}
