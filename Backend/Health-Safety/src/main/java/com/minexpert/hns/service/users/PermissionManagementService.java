package com.minexpert.hns.service.users;

import com.minexpert.hns.dto.users.PermissionManagementDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PermissionManagementService {
    PermissionManagementDTO create(PermissionManagementDTO dto) throws HSException;

    PermissionManagementDTO update(PermissionManagementDTO dto) throws HSException;

    PermissionManagementDTO updateStatus(Long id, Status status) throws HSException;

    PermissionManagementDTO getById(Long id) throws HSException;

    List<PermissionManagementDTO> getAll() throws HSException;

    PermissionManagementDTO getByEmployeeId(Long employeeId) throws HSException;

    List<Long> getRegisteredEmployeeIds() throws HSException;
}
