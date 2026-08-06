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

    // ── Réservé = approuvé non encore distribué (incrément 6/monitoring) ──
    @Query("SELECT COALESCE(SUM(e.quantityApproved - COALESCE(e.quantityIssued,0)),0) FROM PpeEmp e "
            + "WHERE (:companyId IS NULL OR e.companyId = :companyId) "
            + "AND e.quantityApproved > COALESCE(e.quantityIssued,0)")
    Long sumReservedByCompany(@Param("companyId") Long companyId);

    @Query("SELECT e.ppe.id, SUM(e.quantityApproved - COALESCE(e.quantityIssued,0)) FROM PpeEmp e "
            + "WHERE (:companyId IS NULL OR e.companyId = :companyId) "
            + "AND e.quantityApproved > COALESCE(e.quantityIssued,0) GROUP BY e.ppe.id")
    List<Object[]> reservedByPpe(@Param("companyId") Long companyId);

    // ── Consommation & coût EPI par employé (page « Mes EPI ») ──
    // quantité = Σ distribué ; coût = Σ distribué × prix de référence de l'EPI.
    @Query("SELECT e.empId, SUM(COALESCE(e.quantityIssued,0)), "
            + "SUM(COALESCE(e.quantityIssued,0) * COALESCE(e.ppe.referencePrice,0)) "
            + "FROM PpeEmp e WHERE (:companyId IS NULL OR e.companyId = :companyId) "
            + "AND e.empId IS NOT NULL GROUP BY e.empId")
    List<Object[]> consumptionByEmp(@Param("companyId") Long companyId);

    // ── Suivi des dotations : attributions détaillées (empId + EPI) d'une mine ──
    // [empId, ppeId, name, category, brand, model, size, lifespanMonths, referencePrice,
    //  quantityIssued, quantityReturned, date, status]
    @Query("SELECT e.empId, e.ppe.id, e.ppe.name, e.ppe.category, e.ppe.brand, e.ppe.model, e.ppe.size, "
            + "e.ppe.lifespanMonths, e.ppe.referencePrice, e.quantityIssued, e.quantityReturned, e.date, e.status "
            + "FROM PpeEmp e WHERE (:companyId IS NULL OR e.companyId = :companyId) "
            + "AND e.empId IS NOT NULL AND COALESCE(e.quantityIssued,0) > 0")
    List<Object[]> attributionsByCompany(@Param("companyId") Long companyId);

    // ── Roster des employés de la mine (schéma HRMS defaultdb, requête native) ──
    // Le user applicatif lit defaultdb (même serveur). [id, matricule, nom, dept, poste]
    @Query(value = "SELECT e.id, e.unique_number, "
            + "TRIM(CONCAT(COALESCE(e.first_name,''),' ',COALESCE(e.family_name,''))), "
            + "d.name, p.name "
            + "FROM defaultdb.employee e "
            + "LEFT JOIN defaultdb.department d ON d.id = e.department_id "
            + "LEFT JOIN defaultdb.position p ON p.id = e.position_id "
            + "WHERE e.company_id = :companyId", nativeQuery = true)
    List<Object[]> rosterByCompany(@Param("companyId") Long companyId);
}
