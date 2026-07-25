package com.minexpert.hns.repository.featureflags;

import com.minexpert.hns.entity.featureflags.CompanyModuleActivation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyModuleActivationRepository extends JpaRepository<CompanyModuleActivation, Long> {

    List<CompanyModuleActivation> findByCompanyId(Long companyId);

    Optional<CompanyModuleActivation> findByCompanyIdAndModule(Long companyId, String module);
}
