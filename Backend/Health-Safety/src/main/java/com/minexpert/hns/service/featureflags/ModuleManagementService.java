package com.minexpert.hns.service.featureflags;

import com.minexpert.hns.dto.featureflags.ModuleManagementDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ModuleManagementService {
    ModuleManagementDTO create(ModuleManagementDTO dto) throws HSException;

    ModuleManagementDTO update(ModuleManagementDTO dto) throws HSException;

    ModuleManagementDTO updateStatus(Long id, Status status) throws HSException;

    ModuleManagementDTO getById(Long id) throws HSException;

    ModuleManagementDTO getByModule(String module) throws HSException;

    List<ModuleManagementDTO> getAll() throws HSException;
}

