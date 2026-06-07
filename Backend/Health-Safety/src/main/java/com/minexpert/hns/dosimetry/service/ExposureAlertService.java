package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;
import com.minexpert.hns.dosimetry.dto.ExposureAlertEnrichedDTO;

public interface ExposureAlertService {

    Long create(Long companyId, ExposureAlertDTO dto);

    void update(Long companyId, ExposureAlertDTO dto);

    List<ExposureAlertDTO> getAll(Long companyId);

    ExposureAlertDTO getById(Long id);

    void delete(Long id);

    // ----------------------------------------------------------------------------
    // Phase 5 — workflow ACTIVE -> ACK -> RESOLVED + listes operationnelles.
    // ----------------------------------------------------------------------------

    /**
     * Acquittement d'une alerte (ACTIVE -> ACK).
     *
     * @param alertId id de l'alerte (statut courant doit etre ACTIVE)
     * @param actorId id utilisateur effectuant l'action
     * @param note    commentaire libre (peut etre null)
     * @throws IllegalStateException si le statut courant n'est pas ACTIVE
     */
    void acknowledge(Long alertId, Long actorId, String note);

    /**
     * Resolution d'une alerte (ACTIVE ou ACK -> RESOLVED).
     *
     * @param alertId id de l'alerte
     * @param actorId id utilisateur effectuant l'action
     * @param resolutionNote commentaire libre (peut etre null)
     * @throws IllegalStateException si le statut courant n'est ni ACTIVE ni ACK
     */
    void resolve(Long alertId, Long actorId, String resolutionNote);

    /**
     * Liste les alertes ACTIVE pour une mine donnee avec enrichissement worker
     * (employeeId, mineId, category).
     */
    List<ExposureAlertEnrichedDTO> findActiveByMine(Long mineId);

    /**
     * Liste les alertes ACTIVE pour un travailleur donne (vue par worker).
     */
    List<ExposureAlertEnrichedDTO> findActiveByWorker(Long workerId);
}
