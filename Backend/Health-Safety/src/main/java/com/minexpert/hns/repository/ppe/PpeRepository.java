package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PpeRepository extends JpaRepository<Ppe, Long> {
    List<Ppe> findByStatus(PpeStatus status);

    // Find PPE items where current stock is below minimum stock
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Ppe p WHERE p.stock < p.minStock")
    List<Ppe> findLowStock();

    List<Ppe> findByIdIn(List<Long> ids);

    // --- Cloisonnement par mine (companyId) ; companyId null = pas de filtre (appel système/allMines) ---
    @Query("SELECT p FROM Ppe p WHERE (:companyId IS NULL OR p.companyId = :companyId)")
    List<Ppe> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT p FROM Ppe p WHERE p.status = :status AND (:companyId IS NULL OR p.companyId = :companyId)")
    List<Ppe> findByStatusAndCompany(@Param("status") PpeStatus status, @Param("companyId") Long companyId);
}
