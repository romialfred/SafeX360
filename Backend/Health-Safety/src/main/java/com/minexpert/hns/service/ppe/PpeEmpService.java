package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeEmpService {
    PpeEmpDTO create(PpeEmpDTO dto) throws HSException;

    public List<Long> createMultiple(List<PpeEmpDTO> dtos) throws HSException;

    PpeEmpDTO update(PpeEmpDTO dto, Long companyId) throws HSException;

    PpeEmpDTO getById(Long id, Long companyId) throws HSException;

    List<PpeEmpDTO> getByEmpId(Long empId, Long companyId) throws HSException;

    List<PpeEmpDTO> getByPpeId(Long ppeId, Long companyId) throws HSException;

    List<PpeEmpDTO> getByStatus(String status, Long companyId) throws HSException;

    void activate(Long requestId) throws HSException;

    void deactivate(Long requestId) throws HSException;

    /** Count active PPE assignments for an employee */
    long getAssignedCount(Long empId, Long companyId) throws HSException;

    /** Get list of all employee IDs with their count of active PPE assignments */
    java.util.List<com.minexpert.hns.dto.ppe.EmpPpeCountDTO> getAllEmployeeAssignmentCounts(Long companyId)
            throws HSException;
}
