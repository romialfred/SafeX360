package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PpeStockRepository extends JpaRepository<PpeStock, Long> {
    List<PpeStock> findByPpeId(Long ppeId);

    // --- Cloisonnement par mine (companyId) ; companyId null = pas de filtre ---
    @Query("SELECT s FROM PpeStock s WHERE (:companyId IS NULL OR s.companyId = :companyId)")
    List<PpeStock> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT s FROM PpeStock s WHERE s.ppe.id = :ppeId AND (:companyId IS NULL OR s.companyId = :companyId)")
    List<PpeStock> findByPpeIdAndCompany(@Param("ppeId") Long ppeId, @Param("companyId") Long companyId);
}
