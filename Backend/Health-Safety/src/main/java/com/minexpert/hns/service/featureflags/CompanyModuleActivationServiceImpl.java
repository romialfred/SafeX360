package com.minexpert.hns.service.featureflags;

import com.minexpert.hns.api.users.ModuleCatalog;
import com.minexpert.hns.dto.featureflags.CompanyModuleActivationDTO;
import com.minexpert.hns.entity.featureflags.CompanyModuleActivation;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.featureflags.CompanyModuleActivationRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CompanyModuleActivationServiceImpl implements CompanyModuleActivationService {

    private final CompanyModuleActivationRepository repository;

    private void requireCompany(Long companyId) throws HSException {
        if (companyId == null || companyId <= 0) {
            throw new HSException("COMPANY_REQUIRED");
        }
    }

    /** Desactivations/reactivations d'une mine, indexees par cle de module. */
    private Map<String, Status> overridesOf(Long companyId) {
        return repository.findByCompanyId(companyId).stream()
                .collect(Collectors.toMap(CompanyModuleActivation::getModule,
                        CompanyModuleActivation::getStatus, (a, b) -> b));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyModuleActivationDTO> allOverrides() {
        return repository.findAll().stream().map(CompanyModuleActivationDTO::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyModuleActivationDTO> statusesForCompany(Long companyId) {
        // Chaque cle du catalogue est renvoyee : override si present, sinon ACTIF.
        Map<String, Status> overrides = companyId == null ? Map.of() : overridesOf(companyId);
        return ModuleCatalog.MODULES.stream()
                .map(m -> CompanyModuleActivationDTO.of(
                        companyId, m.key(), overrides.getOrDefault(m.key(), Status.ACTIVE)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> activeModulesForCompany(Long companyId) {
        Map<String, Status> overrides = companyId == null ? Map.of() : overridesOf(companyId);
        // Defaut ACTIF : un module est actif tant qu'il n'est pas explicitement INACTIF.
        return ModuleCatalog.MODULES.stream()
                .map(ModuleCatalog.Module::key)
                .filter(key -> overrides.getOrDefault(key, Status.ACTIVE) != Status.INACTIVE)
                .toList();
    }

    @Override
    public CompanyModuleActivationDTO setStatus(Long companyId, String module, Status status) throws HSException {
        requireCompany(companyId);
        if (status == null) {
            throw new HSException("STATUS_REQUIRED");
        }
        // Cle du catalogue exigee : une cle inventee est refusee (source unique).
        if (!ModuleCatalog.KEYS.contains(module)) {
            throw new HSException("UNKNOWN_MODULE");
        }
        CompanyModuleActivation entity = repository.findByCompanyIdAndModule(companyId, module)
                .orElseGet(() -> {
                    CompanyModuleActivation e = new CompanyModuleActivation();
                    e.setCompanyId(companyId);
                    e.setModule(module);
                    return e;
                });
        entity.setStatus(status);
        return CompanyModuleActivationDTO.fromEntity(repository.save(entity));
    }
}
