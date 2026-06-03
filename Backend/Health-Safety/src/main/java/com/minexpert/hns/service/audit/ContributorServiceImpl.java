package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.ContributorDTO;
import com.minexpert.hns.entity.audit.Contributor;
import com.minexpert.hns.repository.audit.ContributorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContributorServiceImpl implements ContributorService {
    private final ContributorRepository contributorRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTORS_BY_AUDIT, key = "#contributorDTO.auditId", condition = "#contributorDTO.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTOR_BY_ID, key = "#result", condition = "#result != null")
    })
    public Long createContributor(ContributorDTO contributorDTO) {
        contributorDTO.setCreatedAt(LocalDateTime.now());
        contributorDTO.setUpdatedAt(LocalDateTime.now());
        return contributorRepository.save(contributorDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.CONTRIBUTOR_BY_ID, key = "#id")
    public ContributorDTO getContributorById(Long id) {
        return contributorRepository.findById(id).orElseThrow(() -> new RuntimeException("CONTRIBUTOR_NOT_FOUND"))
                .toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTOR_BY_ID, key = "#contributorDTO.id"),
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTORS_BY_AUDIT, allEntries = true)
    })
    public void updateContributor(ContributorDTO contributorDTO) {
        ContributorDTO existingContributor = getContributorById(contributorDTO.getId());
        existingContributor.setName(contributorDTO.getName());
        existingContributor.setRole(contributorDTO.getRole());
        existingContributor.setSection(contributorDTO.getSection());
        existingContributor.setUpdatedAt(LocalDateTime.now());
        contributorRepository.save(existingContributor.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTOR_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTORS_BY_AUDIT, allEntries = true)
    })
    public void deleteContributor(Long id) {
        contributorRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.CONTRIBUTORS_BY_AUDIT, key = "#auditId")
    public List<ContributorDTO> getContributorByAuditId(Long auditId) {
        return ((List<Contributor>) contributorRepository.findByAudit_Id(auditId)).stream().map(Contributor::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTORS_BY_AUDIT, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.CONTRIBUTOR_BY_ID, allEntries = true)
    })
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
