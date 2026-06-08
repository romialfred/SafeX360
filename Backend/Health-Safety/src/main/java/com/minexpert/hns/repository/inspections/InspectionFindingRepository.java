package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.entity.inspections.InspectionFinding;
import com.minexpert.hns.enums.FindingConformity;

/**
 * Acces aux constats (findings) realises sur le terrain.
 */
public interface InspectionFindingRepository
        extends JpaRepository<InspectionFinding, Long> {

    /**
     * Liste des findings d'une inspection ordonnee par {@code displayOrder}
     * du checkpoint associe (pour reproduire l'ordre de saisie/affichage).
     */
    List<InspectionFinding> findByInspectionIdOrderByCheckpointDisplayOrderAsc(Long inspectionId);

    /** Compte les findings non conformes d'une inspection (KPI rapport). */
    long countByInspectionIdAndConformity(Long inspectionId, FindingConformity conformity);

    /** Supprime tous les findings d'une inspection (utilise au reset). */
    void deleteByInspectionId(Long inspectionId);
}
