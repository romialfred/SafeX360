package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeRequestService {
    PpeRequestDTO create(PpeRequestDTO dto) throws HSException;

    PpeRequestDTO update(PpeRequestDTO dto, Long companyId) throws HSException;

    PpeRequestDTO approveRequest(Long id, String comment, Long companyId) throws HSException;

    PpeRequestDTO rejectRequest(Long id, String comment, Long companyId) throws HSException;

    PpeRequestDTO deliverRequest(Long id, String comment, Long companyId) throws HSException;

    PpeRequestDTO getById(Long id, Long companyId) throws HSException;

    List<PpeRequestDTO> getAllRequests(Long companyId) throws HSException;
}
