package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PpeEmpRepository extends JpaRepository<PpeEmp, Long> {
    List<PpeEmp> findByEmpId(Long empId);

    List<PpeEmp> findByPpeId(Long ppeId);

    List<PpeEmp> findByStatus(PpeEmpStatus status);

    List<PpeEmp> findByPpeRequestId(Long ppeRequestId);

    // Count active assignments for a given employee
    long countByEmpIdAndStatus(Long empId, PpeEmpStatus status); // This line remains unchanged

    /**
     * Count active PPE assignments grouped by employee
     */
    @org.springframework.data.jpa.repository.Query("SELECT new com.minexpert.hns.dto.ppe.EmpPpeCountDTO(e.empId, COUNT(e)) "
            +
            "FROM PpeEmp e WHERE e.status = :status GROUP BY e.empId")
    java.util.List<com.minexpert.hns.dto.ppe.EmpPpeCountDTO> countActiveAssignmentsByEmp(
            @Param("status") PpeEmpStatus status);
}
