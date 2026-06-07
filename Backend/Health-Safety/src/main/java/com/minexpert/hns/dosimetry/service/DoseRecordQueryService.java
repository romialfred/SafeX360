package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;

/**
 * Service de requetes read-only sur les DoseRecord.
 *
 * <p>Separation de la couche CRUD historique ({@link DoseRecordService}) et de la couche query
 * (joins, projections, audit history). Sert le frontend Registre, la fiche 360 et la vue
 * "historique des versions" (chainage append-only via supersededRecordId).
 */
public interface DoseRecordQueryService {

    /**
     * Renvoie les DoseRecord ACTIFS d'un worker (supersededRecordId IS NULL = derniere version
     * en cours pour chaque period).
     */
    List<DoseRecordDTO> findActiveByWorker(Long workerId);

    /**
     * Renvoie les DoseRecord ACTIFS d'un worker pour une annee donnee, ordonnes par period ASC.
     * Utilise pour le trend annuel (courbe par mois / trimestre).
     */
    List<DoseRecordDTO> findByWorkerYear(Long workerId, int year);

    /**
     * Renvoie TOUTES les versions (actives + superseded) d'un (worker, period), ordonnees par
     * version croissante. Utilise par la vue audit / historique pour materialiser la chaine
     * append-only.
     */
    List<DoseRecordDTO> findHistoryByWorkerWithVersions(Long workerId, String period);
}
