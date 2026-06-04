package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.AuditorDTO;
import com.minexpert.hns.entity.audit.Auditor;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditorRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AuditorServiceImpl implements AuditorService {

    private final AuditorRepository auditorRepository;

    @Override
    public Long addAuditor(AuditorDTO auditorDTO) throws HSException {
        auditorDTO.setCreatedAt(LocalDateTime.now());
        auditorDTO.setUpdatedAt(LocalDateTime.now());
        return auditorRepository.save(auditorDTO.toEntity()).getId();
    }

    @Override
    public List<Long> addAuditors(List<AuditorDTO> auditorDTOs, Long auditId) throws HSException {
        for (AuditorDTO auditorDTO : auditorDTOs) {
            auditorDTO.setCreatedAt(LocalDateTime.now());
            auditorDTO.setUpdatedAt(LocalDateTime.now());
            auditorDTO.setAuditId(auditId);
        }
        return ((List<Auditor>) auditorRepository.saveAll(auditorDTOs.stream().map(AuditorDTO::toEntity).toList()))
                .stream()
                .map(auditor -> auditor.getId()).toList();
    }

    @Override
    public List<Long> addOrUpdateAuditors(List<AuditorDTO> auditorDTOs, Long auditId) throws HSException {
        for (AuditorDTO auditorDTO : auditorDTOs) {
            if (auditorDTO.getId() == null) {
                auditorDTO.setCreatedAt(LocalDateTime.now());
            }
            auditorDTO.setUpdatedAt(LocalDateTime.now());
            auditorDTO.setAuditId(auditId);
        }
        return ((List<Auditor>) auditorRepository.saveAll(auditorDTOs.stream().map(AuditorDTO::toEntity).toList()))
                .stream()
                .map(auditor -> auditor.getId()).toList();
    }

    @Override
    public void updateAuditor(AuditorDTO auditorDTO) throws HSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateAuditor'");
    }

    @Override
    public void deleteAuditor(Long id) throws HSException {
        auditorRepository.deleteById(id);
    }

    @Override
    public AuditorDTO getAuditorById(Long id) throws HSException {
        Auditor auditor = auditorRepository.findById(id).orElseThrow(() -> new HSException("AUDITOR_NOT_FOUND"));
        return auditor.toDTO();
    }

    @Override
    public List<AuditorDTO> getAuditorsByAuditId(Long auditId) throws HSException {
        return ((List<Auditor>) auditorRepository.findByAudit_Id(auditId)).stream()
                .map(Auditor::toDTO)
                .toList();
    }

    @Override
    public List<AuditorDTO> getLeadAuditorsForPlanning() throws HSException {
        return ((List<Auditor>) auditorRepository.findLeadAuditorsForPlanning()).stream()
                .map(Auditor::toDTO)
                .toList();
    }

    @Override
    public List<AuditorDTO> getLeadAuditors() throws HSException {
        return ((List<Auditor>) auditorRepository.findLeadAuditors()).stream()
                .map(Auditor::toDTO)
                .toList();
    }

}
