package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    // --- Cloisonnement par mine (companyId) ; companyId null = pas de filtre ---
    @Query("SELECT e FROM PpeEmp e WHERE e.empId = :empId AND (:companyId IS NULL OR e.companyId = :companyId)")
    List<PpeEmp> findByEmpIdAndCompany(@Param("empId") Long empId, @Param("companyId") Long companyId);

    @Query("SELECT e FROM PpeEmp e WHERE e.ppe.id = :ppeId AND (:companyId IS NULL OR e.companyId = :companyId)")
    List<PpeEmp> findByPpeIdAndCompany(@Param("ppeId") Long ppeId, @Param("companyId") Long companyId);

    @Query("SELECT e FROM PpeEmp e WHERE e.status = :status AND (:companyId IS NULL OR e.companyId = :companyId)")
    List<PpeEmp> findByStatusAndCompany(@Param("status") PpeEmpStatus status, @Param("companyId") Long companyId);

    @Query("SELECT COUNT(e) FROM PpeEmp e WHERE e.empId = :empId AND e.status = :status "
            + "AND (:companyId IS NULL OR e.companyId = :companyId)")
    long countByEmpIdAndStatusAndCompany(@Param("empId") Long empId, @Param("status") PpeEmpStatus status,
            @Param("companyId") Long companyId);

    @Query("SELECT new com.minexpert.hns.dto.ppe.EmpPpeCountDTO(e.empId, COUNT(e)) "
            + "FROM PpeEmp e WHERE e.status = :status AND (:companyId IS NULL OR e.companyId = :companyId) "
            + "GROUP BY e.empId")
    java.util.List<com.minexpert.hns.dto.ppe.EmpPpeCountDTO> countActiveAssignmentsByEmpAndCompany(
            @Param("status") PpeEmpStatus status, @Param("companyId") Long companyId);
}
