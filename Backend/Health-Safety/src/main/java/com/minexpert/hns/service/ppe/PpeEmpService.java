package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeEmpService {
    PpeEmpDTO create(PpeEmpDTO dto) throws HSException;

    public List<Long> createMultiple(List<PpeEmpDTO> dtos) throws HSException;

    PpeEmpDTO update(PpeEmpDTO dto) throws HSException;

    PpeEmpDTO getById(Long id) throws HSException;

    List<PpeEmpDTO> getByEmpId(Long empId) throws HSException;

    List<PpeEmpDTO> getByPpeId(Long ppeId) throws HSException;

    List<PpeEmpDTO> getByStatus(String status) throws HSException;

    void activate(Long requestId) throws HSException;

    void deactivate(Long requestId) throws HSException;

    /** Count active PPE assignments for an employee */
    long getAssignedCount(Long empId) throws HSException;

    /** Get list of all employee IDs with their count of active PPE assignments */
    java.util.List<com.minexpert.hns.dto.ppe.EmpPpeCountDTO> getAllEmployeeAssignmentCounts() throws HSException;
}
