package com.minexpert.hns.api.emergency.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.api.emergency.dto.EvacuationPriorityDTO;
import com.minexpert.hns.api.emergency.entity.EvacuationPriorityPerson;
import com.minexpert.hns.api.emergency.repository.EvacuationPriorityRepository;

import lombok.RequiredArgsConstructor;

/**
 * Registre du personnel prioritaire à évacuer (VIP / P1..P3) par mine.
 *
 * <p>Registre persistant, indépendant d'une alerte. Le suivi d'évacuation de ces
 * personnes se fait côté salle de crise en croisant ce registre avec les
 * pointages temps réel. Cloisonné par mine ({@code companyId}).</p>
 */
@Service
@RequiredArgsConstructor
public class EvacuationPriorityService {

    private final EvacuationPriorityRepository repo;

    @Transactional(readOnly = true)
    public List<EvacuationPriorityDTO> list(Long companyId) {
        return repo.findByCompanyId(companyId).stream()
                .sorted(Comparator.comparing(EvacuationPriorityPerson::getLevel))
                .map(this::toDto)
                .toList();
    }

    /** Crée ou met à jour la priorité d'une personne (unique par mine + employé). */
    @Transactional
    public EvacuationPriorityDTO upsert(EvacuationPriorityDTO dto, Long actorId) {
        if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COMPANY_ID_REQUIRED");
        }
        if (dto.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EMPLOYEE_ID_REQUIRED");
        }
        if (dto.getLevel() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PRIORITY_LEVEL_REQUIRED");
        }

        EvacuationPriorityPerson entity = repo
                .findByCompanyIdAndEmployeeId(dto.getCompanyId(), dto.getEmployeeId())
                .orElseGet(() -> EvacuationPriorityPerson.builder()
                        .companyId(dto.getCompanyId())
                        .employeeId(dto.getEmployeeId())
                        .createdBy(actorId)
                        .createdAt(LocalDateTime.now())
                        .build());

        entity.setLevel(dto.getLevel());
        entity.setRoleLabel(trimToNull(dto.getRoleLabel()));
        entity.setNote(trimToNull(dto.getNote()));
        entity.setUpdatedAt(LocalDateTime.now());

        return toDto(repo.save(entity));
    }

    @Transactional
    public boolean delete(Long id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private EvacuationPriorityDTO toDto(EvacuationPriorityPerson e) {
        return EvacuationPriorityDTO.builder()
                .id(e.getId())
                .companyId(e.getCompanyId())
                .employeeId(e.getEmployeeId())
                .level(e.getLevel())
                .roleLabel(e.getRoleLabel())
                .note(e.getNote())
                .build();
    }
}
