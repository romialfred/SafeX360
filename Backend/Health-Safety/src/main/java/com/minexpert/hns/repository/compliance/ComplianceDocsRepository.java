package com.minexpert.hns.repository.compliance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.compliance.DocResponse;
import com.minexpert.hns.entity.compliance.ComplianceDocs;
import com.minexpert.hns.enums.DocStatus;

public interface ComplianceDocsRepository extends CrudRepository<ComplianceDocs, Long> {
    @Query("SELECT new com.minexpert.hns.dto.compliance.DocResponse(d.id, d.media.name, d.media.id, d.requirement.title, null, d.employeeId, d.createdAt, d.expiryDate, d.status, d.comment) FROM ComplianceDocs d ")
    List<DocResponse> findAllDocs();

    // Cloisonnement par mine (company_id). null = pas de filtre (systeme/allMines).
    @Query("SELECT new com.minexpert.hns.dto.compliance.DocResponse(d.id, d.media.name, d.media.id, d.requirement.title, null, d.employeeId, d.createdAt, d.expiryDate, d.status, d.comment) FROM ComplianceDocs d WHERE (:companyId IS NULL OR d.companyId = :companyId)")
    List<DocResponse> findAllDocsByCompany(@org.springframework.data.repository.query.Param("companyId") Long companyId);

    /** company_id d'un document de conformite (garde d'appartenance). */
    @Query("SELECT d.companyId FROM ComplianceDocs d WHERE d.id = :id")
    Optional<Long> findCompanyIdById(@org.springframework.data.repository.query.Param("id") Long id);

    // Le WHERE est vital : sans lui, chaque employé voyait les documents de
    // conformité de TOUS les autres (fuite de données inter-employés).
    @Query("SELECT new com.minexpert.hns.dto.compliance.DocResponse(d.id, d.media.name, d.media.id, d.requirement.title, null, d.employeeId, d.createdAt, d.expiryDate, d.status, d.comment) FROM ComplianceDocs d WHERE d.employeeId = ?1")
    List<DocResponse> findAllDocsByEmpId(Long employeeId);

    @Query("SELECT new com.minexpert.hns.dto.compliance.DocResponse(d.id, d.media.name, d.media.id, d.requirement.title, null, d.employeeId, d.createdAt, d.expiryDate, d.status, d.comment) FROM ComplianceDocs d WHERE d.id = ?1")
    Optional<DocResponse> findDocById(Long id);

    List<ComplianceDocs> findByEmployeeIdAndRequirementIdIn(Long empId, List<Long> requirementIds);

    List<ComplianceDocs> findByEmployeeIdAndRequirementId(Long empId, Long requirementId);

    Optional<ComplianceDocs> findByEmployeeIdAndRequirementIdAndStatusNotAndExpiryDateAfter(Long employeeId,
            Long requirementId,
            DocStatus status, LocalDate expiryDate);

    @Query("""
            SELECT d FROM ComplianceDocs d
            WHERE d.employeeId IN :employeeIds
                AND d.requirement.id IN :requirementIds
            """)
    List<ComplianceDocs> findByEmployeeIdInAndRequirementIdIn(List<Long> employeeIds, List<Long> requirementIds);
}
