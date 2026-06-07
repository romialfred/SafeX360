package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MonitoringCampaignDTO;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.entity.MonitoringCampaign;
import com.minexpert.hns.dosimetry.enums.CampaignStatus;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;
import com.minexpert.hns.dosimetry.repository.MonitoringCampaignRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation du service {@link MonitoringCampaignService}.
 *
 * <p>Workflow strict des transitions de statut : valide via {@link #assertTransition(MonitoringCampaign, CampaignStatus)}.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class MonitoringCampaignServiceImpl implements MonitoringCampaignService {

    private final MonitoringCampaignRepository repository;
    private final MeasurementPointRepository pointRepository;
    private final AmbientMeasurementRepository measurementRepository;
    private final DosimetryAuditService auditService;

    @Override
    public Long createCampaign(MonitoringCampaignDTO dto, Long userId) {
        if (repository.existsByMineIdAndCode(dto.getMineId(), dto.getCode())) {
            throw new IllegalStateException("Campaign code already used in mine: " + dto.getCode());
        }
        LocalDateTime now = LocalDateTime.now();
        MonitoringCampaign entity = MonitoringCampaign.builder()
                .mineId(dto.getMineId())
                .code(dto.getCode())
                .label(dto.getLabel())
                .objective(dto.getObjective())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .status(dto.getStatus() != null ? dto.getStatus() : CampaignStatus.DRAFT)
                .protocol(dto.getProtocol())
                .responsibleId(dto.getResponsibleId())
                .measurementPointIds(dto.getMeasurementPointIds() != null
                        ? new ArrayList<>(dto.getMeasurementPointIds())
                        : new ArrayList<>())
                .createdAt(now)
                .createdBy(userId)
                .updatedAt(now)
                .updatedBy(userId)
                .build();
        MonitoringCampaign saved = repository.save(entity);
        auditService.log("CREATE", "MonitoringCampaign", saved.getId(), userId,
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO,
                "code=" + saved.getCode() + ";status=" + saved.getStatus());
        return saved.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public MonitoringCampaignDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MonitoringCampaign not found: " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonitoringCampaignDTO> listByMine(Long mineId) {
        return repository.findByMineId(mineId).stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void addMeasurementPoint(Long campaignId, Long measurementPointId, Long userId) {
        MonitoringCampaign campaign = repository.findById(campaignId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MonitoringCampaign not found: " + campaignId));
        // Verrou de perimetre : seule la phase DRAFT autorise l'ajout/retrait de points.
        // ONGOING / COMPLETED / CANCELLED rejettent toute modification du perimetre afin de
        // garantir la tracabilite des mesures associees aux points referenes au demarrage.
        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw new IllegalStateException(
                    "Cannot modify campaign perimeter when status is " + campaign.getStatus()
                            + " (only DRAFT allows perimeter changes)");
        }
        MeasurementPoint point = pointRepository.findById(measurementPointId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MeasurementPoint not found: " + measurementPointId));
        if (!point.getMineId().equals(campaign.getMineId())) {
            throw new IllegalArgumentException(
                    "MeasurementPoint mine mismatch with campaign mine");
        }
        if (!campaign.getMeasurementPointIds().contains(measurementPointId)) {
            campaign.getMeasurementPointIds().add(measurementPointId);
            campaign.setUpdatedAt(LocalDateTime.now());
            campaign.setUpdatedBy(userId);
            repository.save(campaign);
            auditService.log("UPDATE", "MonitoringCampaign", campaignId, userId,
                    DosimetryRBACConfig.DOSIMETRY_WRITE,
                    "addPointId=" + measurementPointId);
        }
    }

    @Override
    public void startCampaign(Long campaignId, Long userId) {
        MonitoringCampaign campaign = repository.findById(campaignId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MonitoringCampaign not found: " + campaignId));
        assertTransition(campaign, CampaignStatus.ONGOING);
        campaign.setStatus(CampaignStatus.ONGOING);
        campaign.setUpdatedAt(LocalDateTime.now());
        campaign.setUpdatedBy(userId);
        repository.save(campaign);
        auditService.log("START", "MonitoringCampaign", campaignId, userId,
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, "status=ONGOING");
    }

    @Override
    public void completeCampaign(Long campaignId, Long userId) {
        MonitoringCampaign campaign = repository.findById(campaignId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MonitoringCampaign not found: " + campaignId));
        assertTransition(campaign, CampaignStatus.COMPLETED);
        LocalDateTime now = LocalDateTime.now();
        campaign.setStatus(CampaignStatus.COMPLETED);
        campaign.setCompletedAt(now);
        campaign.setCompletedBy(userId);
        campaign.setUpdatedAt(now);
        campaign.setUpdatedBy(userId);
        repository.save(campaign);
        auditService.log("COMPLETE", "MonitoringCampaign", campaignId, userId,
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, "status=COMPLETED");
    }

    @Override
    public void cancelCampaign(Long campaignId, Long userId) {
        MonitoringCampaign campaign = repository.findById(campaignId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MonitoringCampaign not found: " + campaignId));
        assertTransition(campaign, CampaignStatus.CANCELLED);
        campaign.setStatus(CampaignStatus.CANCELLED);
        campaign.setUpdatedAt(LocalDateTime.now());
        campaign.setUpdatedBy(userId);
        repository.save(campaign);
        auditService.log("CANCEL", "MonitoringCampaign", campaignId, userId,
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, "status=CANCELLED");
    }

    @Override
    @Transactional(readOnly = true)
    public String generateReport(Long campaignId) {
        MonitoringCampaign campaign = repository.findById(campaignId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MonitoringCampaign not found: " + campaignId));
        long measurements = measurementRepository.findByCampaignIdOrderByMeasuredAtDesc(campaignId)
                .size();
        StringBuilder sb = new StringBuilder();
        sb.append("Campaign Report\n");
        sb.append("================\n");
        sb.append("Code: ").append(campaign.getCode()).append('\n');
        sb.append("Label: ").append(campaign.getLabel()).append('\n');
        sb.append("Status: ").append(campaign.getStatus()).append('\n');
        sb.append("Period: ").append(campaign.getStartDate()).append(" -> ")
                .append(campaign.getEndDate()).append('\n');
        sb.append("Responsible: ").append(campaign.getResponsibleId()).append('\n');
        sb.append("Points covered: ").append(campaign.getMeasurementPointIds().size()).append('\n');
        sb.append("Measurements collected: ").append(measurements).append('\n');
        sb.append("Objective: ").append(campaign.getObjective()).append('\n');
        sb.append("Protocol: ").append(campaign.getProtocol()).append('\n');
        return sb.toString();
    }

    /**
     * Verifie qu'une transition de statut est autorisee :
     * <pre>
     *   DRAFT     -&gt; ONGOING | CANCELLED
     *   ONGOING   -&gt; COMPLETED | CANCELLED
     *   COMPLETED -&gt; (aucune)
     *   CANCELLED -&gt; (aucune)
     * </pre>
     */
    private void assertTransition(MonitoringCampaign campaign, CampaignStatus next) {
        CampaignStatus current = campaign.getStatus();
        boolean ok;
        switch (next) {
            case ONGOING:
                ok = current == CampaignStatus.DRAFT;
                break;
            case COMPLETED:
                ok = current == CampaignStatus.ONGOING;
                break;
            case CANCELLED:
                ok = current == CampaignStatus.DRAFT || current == CampaignStatus.ONGOING;
                break;
            default:
                ok = false;
        }
        if (!ok) {
            throw new IllegalStateException(
                    "Invalid campaign status transition: " + current + " -> " + next);
        }
    }

    private MonitoringCampaignDTO toDTO(MonitoringCampaign e) {
        return MonitoringCampaignDTO.builder()
                .id(e.getId())
                .mineId(e.getMineId())
                .code(e.getCode())
                .label(e.getLabel())
                .objective(e.getObjective())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .status(e.getStatus())
                .protocol(e.getProtocol())
                .responsibleId(e.getResponsibleId())
                .measurementPointIds(new ArrayList<>(e.getMeasurementPointIds()))
                .createdAt(e.getCreatedAt())
                .createdBy(e.getCreatedBy())
                .updatedAt(e.getUpdatedAt())
                .updatedBy(e.getUpdatedBy())
                .completedAt(e.getCompletedAt())
                .completedBy(e.getCompletedBy())
                .build();
    }
}
