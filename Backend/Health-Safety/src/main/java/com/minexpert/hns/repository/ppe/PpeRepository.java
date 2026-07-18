package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PpeRepository extends JpaRepository<Ppe, Long> {
    List<Ppe> findByStatus(PpeStatus status);

    // SUPPRIMÉ — findLowStock() : "SELECT p FROM Ppe p WHERE p.stock < p.minStock".
    // Deux défauts : aucun filtre de mine (elle renvoyait les EPI de TOUTES les
    // entreprises) et un `<` strict là où la règle métier est `<=` (un stock
    // exactement AU seuil est déjà en alerte). Elle contredisait donc
    // PpeServiceImpl.getLowStock(companyId), qui applique `<=`, le statut ACTIVE
    // et le cloisonnement. Aucun appelant ne l'utilisait.
    // Pour lister les EPI sous seuil : passer par PpeService.getLowStock(companyId).

    List<Ppe> findByIdIn(List<Long> ids);

    // --- Cloisonnement par mine (companyId) ; companyId null = pas de filtre (appel système/allMines) ---
    @Query("SELECT p FROM Ppe p WHERE (:companyId IS NULL OR p.companyId = :companyId)")
    List<Ppe> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT p FROM Ppe p WHERE p.status = :status AND (:companyId IS NULL OR p.companyId = :companyId)")
    List<Ppe> findByStatusAndCompany(@Param("status") PpeStatus status, @Param("companyId") Long companyId);
}
