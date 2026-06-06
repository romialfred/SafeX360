package com.minexpert.hns.api.emergency.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.EmergencyMediaDTO;
import com.minexpert.hns.api.emergency.entity.EmergencyMedia;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.EmergencyMediaRepository;

import lombok.RequiredArgsConstructor;

/** CRUD médias d'urgence (LOT 48 Phase 1.e). */
@Service
@RequiredArgsConstructor
public class EmergencyMediaService {

    private final EmergencyMediaRepository repository;
    private final EmergencyAuditService auditService;

    public List<EmergencyMediaDTO> list(Long companyId) {
        return repository.findByCompanyIdOrderByMediaTypeAscLocaleAsc(companyId).stream()
            .map(this::toDto).toList();
    }

    @Transactional
    public EmergencyMediaDTO create(EmergencyMediaDTO dto, Long actorId) {
        EmergencyMedia media = applyFromDto(new EmergencyMedia(), dto);
        EmergencyMedia saved = repository.save(media);
        auditService.log(
            EmergencyAuditEventType.MEDIA_UPLOADED,
            actorId, dto.getCompanyId(),
            "EmergencyMedia", saved.getId(),
            "{\"type\":\"" + dto.getMediaType() + "\",\"locale\":\"" + dto.getLocale() + "\"}",
            null, null
        );
        return toDto(saved);
    }

    @Transactional
    public Optional<EmergencyMediaDTO> update(Long id, EmergencyMediaDTO dto, Long actorId) {
        return repository.findById(id).map(media -> {
            applyFromDto(media, dto);
            EmergencyMedia saved = repository.save(media);
            auditService.log(
                EmergencyAuditEventType.MEDIA_UPLOADED,
                actorId, media.getCompanyId(),
                "EmergencyMedia", saved.getId(), null, null, null
            );
            return toDto(saved);
        });
    }

    @Transactional
    public boolean delete(Long id, Long actorId) {
        return repository.findById(id).map(media -> {
            repository.delete(media);
            auditService.log(
                EmergencyAuditEventType.MEDIA_UPLOADED,
                actorId, media.getCompanyId(),
                "EmergencyMedia", id,
                "{\"action\":\"delete\"}", null, null
            );
            return true;
        }).orElse(false);
    }

    private EmergencyMedia applyFromDto(EmergencyMedia media, EmergencyMediaDTO dto) {
        if (dto.getCompanyId() != null) media.setCompanyId(dto.getCompanyId());
        if (dto.getMediaType() != null) media.setMediaType(dto.getMediaType());
        if (dto.getLocale() != null) media.setLocale(dto.getLocale());
        if (dto.getLabel() != null) media.setLabel(dto.getLabel());
        media.setFilePath(dto.getFilePath());
        media.setTtsText(dto.getTtsText());
        if (dto.getIsDefault() != null) media.setIsDefault(dto.getIsDefault());
        if (dto.getStatus() != null) media.setStatus(dto.getStatus());
        return media;
    }

    private EmergencyMediaDTO toDto(EmergencyMedia m) {
        return EmergencyMediaDTO.builder()
            .id(m.getId())
            .companyId(m.getCompanyId())
            .mediaType(m.getMediaType())
            .locale(m.getLocale())
            .label(m.getLabel())
            .filePath(m.getFilePath())
            .ttsText(m.getTtsText())
            .isDefault(m.getIsDefault())
            .status(m.getStatus())
            .build();
    }
}
