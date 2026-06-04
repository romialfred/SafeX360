package com.minexpert.hns.service.featureflags;

import com.minexpert.hns.dto.featureflags.ModuleManagementDTO;
import com.minexpert.hns.entity.featureflags.ModuleManagement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.featureflags.ModuleManagementRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ModuleManagementServiceImpl implements ModuleManagementService {
    private final ModuleManagementRepository repository;

    @Override
    public ModuleManagementDTO create(ModuleManagementDTO dto) throws HSException {
        // Enforce uniqueness by module key
        repository.findByModule(dto.getModule()).ifPresent(m -> {
            throw new RuntimeException("MODULE_ALREADY_EXISTS");
        });
        ModuleManagement saved = repository.save(dto.toEntity());
        return saved.toDTO();
    }

    @Override
    public ModuleManagementDTO update(ModuleManagementDTO dto) throws HSException {
        ModuleManagement existing = repository.findById(dto.getId())
                .orElseThrow(() -> new HSException("MODULE_NOT_FOUND"));
        // Allow updating module name and status
        existing.setModule(dto.getModule());
        existing.setStatus(dto.getStatus());
        ModuleManagement updated = repository.save(existing);
        return updated.toDTO();
    }

    @Override
    public ModuleManagementDTO updateStatus(Long id, Status status) throws HSException {
        ModuleManagement existing = repository.findById(id)
                .orElseThrow(() -> new HSException("MODULE_NOT_FOUND"));
        existing.setStatus(status);
        ModuleManagement updated = repository.save(existing);
        return updated.toDTO();
    }

    @Override
    public ModuleManagementDTO getById(Long id) throws HSException {
        ModuleManagement entity = repository.findById(id)
                .orElseThrow(() -> new HSException("MODULE_NOT_FOUND"));
        return entity.toDTO();
    }

    @Override
    public ModuleManagementDTO getByModule(String module) throws HSException {
        ModuleManagement entity = repository.findByModule(module)
                .orElseThrow(() -> new HSException("MODULE_NOT_FOUND"));
        return entity.toDTO();
    }

    @Override
    public List<ModuleManagementDTO> getAll() throws HSException {
        return repository.findAll().stream().map(ModuleManagement::toDTO).toList();
    }
}
