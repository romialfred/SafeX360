package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeRequestService {
    PpeRequestDTO create(PpeRequestDTO dto) throws HSException;

    PpeRequestDTO update(PpeRequestDTO dto) throws HSException;

    PpeRequestDTO approveRequest(Long id, String comment) throws HSException;

    PpeRequestDTO rejectRequest(Long id, String comment) throws HSException;

    PpeRequestDTO getById(Long id) throws HSException;

    List<PpeRequestDTO> getAllRequests() throws HSException;
}
