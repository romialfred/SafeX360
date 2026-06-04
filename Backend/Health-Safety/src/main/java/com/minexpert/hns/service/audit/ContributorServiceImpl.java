package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.ContributorDTO;
import com.minexpert.hns.entity.audit.Contributor;
import com.minexpert.hns.repository.audit.ContributorRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ContributorServiceImpl implements ContributorService {
    private final ContributorRepository contributorRepository;

    @Override
    public Long createContributor(ContributorDTO contributorDTO) {
        contributorDTO.setCreatedAt(LocalDateTime.now());
        contributorDTO.setUpdatedAt(LocalDateTime.now());
        return contributorRepository.save(contributorDTO.toEntity()).getId();
    }

    @Override
    public ContributorDTO getContributorById(Long id) {
        return contributorRepository.findById(id).orElseThrow(() -> new RuntimeException("CONTRIBUTOR_NOT_FOUND"))
                .toDTO();
    }

    @Override
    public void updateContributor(ContributorDTO contributorDTO) {
        ContributorDTO existingContributor = getContributorById(contributorDTO.getId());
        existingContributor.setName(contributorDTO.getName());
        existingContributor.setRole(contributorDTO.getRole());
        existingContributor.setSection(contributorDTO.getSection());
        existingContributor.setUpdatedAt(LocalDateTime.now());
        contributorRepository.save(existingContributor.toEntity());
    }

    @Override
    public void deleteContributor(Long id) {
        contributorRepository.deleteById(id);
    }

    @Override
    public List<ContributorDTO> getContributorByAuditId(Long auditId) {
        return ((List<Contributor>) contributorRepository.findByAudit_Id(auditId)).stream().map(Contributor::toDTO)
                .toList();
    }

    @Override
    public List<Long> createContributors(List<ContributorDTO> contributorDTOs) {
        contributorDTOs.forEach(contributorDTO -> {
            contributorDTO.setCreatedAt(LocalDateTime.now());
            contributorDTO.setUpdatedAt(LocalDateTime.now());
        });
        return ((List<Contributor>) contributorRepository
                .saveAll(contributorDTOs.stream().map(ContributorDTO::toEntity).toList()))
                .stream()
                .map(Contributor::getId)
                .toList();
    }

}
