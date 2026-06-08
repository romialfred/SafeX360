package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.entity.inspections.InspectionCheckpoint;

/**
 * Acces aux points de controle. La plupart des requetes passent par le
 * parent {@code InspectionTemplate.checkpoints} grace au cascade JPA ;
 * ce repository couvre les rares besoins isoles (recherche directe par ID,
 * batch delete pour migration).
 */
public interface InspectionCheckpointRepository
        extends JpaRepository<InspectionCheckpoint, Long> {

    /** Liste des checkpoints d'un template ordonnee par {@code displayOrder}. */
    List<InspectionCheckpoint> findByTemplateIdOrderByDisplayOrderAsc(Long templateId);
}
