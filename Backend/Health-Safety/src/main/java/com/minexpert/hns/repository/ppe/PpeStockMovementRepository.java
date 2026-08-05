package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeStockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
