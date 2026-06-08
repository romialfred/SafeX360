package com.minexpert.hns.repository.inspections;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.entity.inspections.InspectionApproval;

/**
 * Acces aux approbations equipe. La contrainte d'unicite
 * (inspection_id, approver_id) garantit qu'un membre ne peut se prononcer
 * qu'une seule fois par cycle de validation.
 */
public interface InspectionApprovalRepository
        extends JpaRepository<InspectionApproval, Long> {

    /** Toutes les approbations d'une inspection. */
    List<InspectionApproval> findByInspectionIdOrderByDecidedAtAsc(Long inspectionId);

    /** Approbation existante d'un membre donne sur une inspection donnee. */
    Optional<InspectionApproval> findByInspectionIdAndApproverId(Long inspectionId, Long approverId);

    /** Compte les decisions par valeur (APPROVE/REJECT) pour une inspection. */
    long countByInspectionIdAndDecision(Long inspectionId, String decision);

    /**
     * Reset des approbations apres rejet : utilise quand l'inspection
     * retourne IN_PROGRESS pour effacer toutes les decisions precedentes.
     */
    void deleteByInspectionId(Long inspectionId);
}
