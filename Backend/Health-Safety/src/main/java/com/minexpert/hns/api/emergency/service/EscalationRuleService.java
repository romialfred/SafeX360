package com.minexpert.hns.api.emergency.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.EscalationRuleDTO;
import com.minexpert.hns.api.emergency.entity.EscalationRule;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.EscalationRuleRepository;

import lombok.RequiredArgsConstructor;

/** CRUD règles d'escalade (LOT 48 Phase 1.d). */
@Service
@RequiredArgsConstructor
public class EscalationRuleService {

    private final EscalationRuleRepository repository;
    private final EmergencyAuditService auditService;

    public List<EscalationRuleDTO> list(Long companyId) {
        return repository.findByCompanyIdOrderByStepOrderAsc(companyId).stream()
            .map(this::toDto).toList();
    }

    @Transactional
    public EscalationRuleDTO create(EscalationRuleDTO dto, Long actorId) {
        EscalationRule rule = applyFromDto(new EscalationRule(), dto);
        EscalationRule saved = repository.save(rule);
        auditService.log(
            EmergencyAuditEventType.ESCALATION_RULE_CREATED,
            actorId, dto.getCompanyId(),
            "EscalationRule", saved.getId(), null, null, null
        );
        return toDto(saved);
    }

    @Transactional
    public Optional<EscalationRuleDTO> update(Long id, EscalationRuleDTO dto, Long actorId) {
        return repository.findById(id).map(rule -> {
            applyFromDto(rule, dto);
            EscalationRule saved = repository.save(rule);
            auditService.log(
                EmergencyAuditEventType.ESCALATION_RULE_UPDATED,
                actorId, rule.getCompanyId(),
                "EscalationRule", saved.getId(), null, null, null
            );
            return toDto(saved);
        });
    }

    @Transactional
    public boolean delete(Long id, Long actorId) {
        return repository.findById(id).map(rule -> {
            repository.delete(rule);
            auditService.log(
                EmergencyAuditEventType.ESCALATION_RULE_UPDATED,
                actorId, rule.getCompanyId(),
                "EscalationRule", id,
                "{\"action\":\"delete\"}", null, null
            );
            return true;
        }).orElse(false);
    }

    private EscalationRule applyFromDto(EscalationRule rule, EscalationRuleDTO dto) {
        if (dto.getCompanyId() != null) rule.setCompanyId(dto.getCompanyId());
        if (dto.getName() != null) rule.setName(dto.getName());
        if (dto.getDescription() != null) rule.setDescription(dto.getDescription());
        if (dto.getStepOrder() != null) rule.setStepOrder(dto.getStepOrder());
        rule.setTargetUserId(dto.getTargetUserId());
        rule.setTargetPermission(dto.getTargetPermission());
        if (dto.getDelaySeconds() != null) rule.setDelaySeconds(dto.getDelaySeconds());
        if (dto.getStatus() != null) rule.setStatus(dto.getStatus());
        return rule;
    }

    private EscalationRuleDTO toDto(EscalationRule r) {
        return EscalationRuleDTO.builder()
            .id(r.getId())
            .companyId(r.getCompanyId())
            .name(r.getName())
            .description(r.getDescription())
            .stepOrder(r.getStepOrder())
            .targetUserId(r.getTargetUserId())
            .targetPermission(r.getTargetPermission())
            .delaySeconds(r.getDelaySeconds())
            .status(r.getStatus())
            .build();
    }
}
