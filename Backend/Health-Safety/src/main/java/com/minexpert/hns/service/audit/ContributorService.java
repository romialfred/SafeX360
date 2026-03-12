package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.ContributorDTO;

public interface ContributorService {
    public Long createContributor(ContributorDTO contributorDTO);

    public List<Long> createContributors(List<ContributorDTO> contributorDTOs);

    public ContributorDTO getContributorById(Long id);

    public void updateContributor(ContributorDTO contributorDTO);

    public void deleteContributor(Long id);

    public List<ContributorDTO> getContributorByAuditId(Long auditId);
}
