package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeStockMovement;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PpeStockMovementRepository extends JpaRepository<PpeStockMovement, Long> {

    /** Historique d'un EPI, du plus récent au plus ancien, cloisonné par mine. */
    @Query("SELECT m FROM PpeStockMovement m WHERE m.ppeId = :ppeId "
            + "AND (:companyId IS NULL OR m.companyId = :companyId) "
            + "ORDER BY m.createdAt DESC, m.id DESC")
    List<PpeStockMovement> findHistory(@Param("ppeId") Long ppeId, @Param("companyId") Long companyId);

    /**
     * Somme des mouvements d'un EPI = son stock théorique. Sert au contrôle
     * d'invariant (doit égaler {@code Ppe.stock}). Renvoie null si aucun mouvement.
     */
    @Query("SELECT SUM(m.quantity) FROM PpeStockMovement m WHERE m.ppeId = :ppeId")
    Long sumQuantityByPpeId(@Param("ppeId") Long ppeId);

    // ── Agrégations décisionnelles (incrément 6) ────────────────────────────────
    // Bornes de dates optionnelles (null = pas de borne). Cloisonné par mine.

    /**
     * Somme signée + nombre de mouvements par TYPE, sur une période et une mine.
     * Chaque ligne = [PpeMovementType type, Long sumQuantity, Long count].
     */
    @Query("SELECT m.movementType, SUM(m.quantity), COUNT(m) FROM PpeStockMovement m "
            + "WHERE (:companyId IS NULL OR m.companyId = :companyId) "
            + "AND (:from IS NULL OR m.createdAt >= :from) "
            + "AND (:to IS NULL OR m.createdAt <= :to) "
            + "GROUP BY m.movementType")
    List<Object[]> aggregateByType(@Param("companyId") Long companyId,
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /**
     * Consommation par EPI pour un type de mouvement donné (ex. ISSUE), sur une
     * période et une mine. Chaque ligne = [Long ppeId, Long sumQuantity] ;
     * sumQuantity garde le signe stocké (négatif pour les sorties).
     */
    @Query("SELECT m.ppeId, SUM(m.quantity) FROM PpeStockMovement m "
            + "WHERE m.movementType = :type "
            + "AND (:companyId IS NULL OR m.companyId = :companyId) "
            + "AND (:from IS NULL OR m.createdAt >= :from) "
            + "AND (:to IS NULL OR m.createdAt <= :to) "
            + "GROUP BY m.ppeId")
    List<Object[]> sumByPpeForType(@Param("type") PpeMovementType type,
            @Param("companyId") Long companyId,
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
