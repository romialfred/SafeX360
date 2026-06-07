package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.OverexposureCaseDTO;
import com.minexpert.hns.dosimetry.enums.AlertLevel;

public interface OverexposureCaseService {

    Long create(Long companyId, OverexposureCaseDTO dto);

    void update(Long companyId, OverexposureCaseDTO dto);

    List<OverexposureCaseDTO> getAll(Long companyId);

    OverexposureCaseDTO getById(Long id);

    void delete(Long id);

    // ----------------------------------------------------------------------------
    // Phase 5 — workflow OPEN -> INVESTIGATING -> CLOSED.
    // ----------------------------------------------------------------------------

    /**
     * Ouverture d'un dossier de surexposition.
     *
     * @param workerId  id du travailleur (FK ExposedWorker)
     * @param alertId   id de l'alerte source (peut etre null pour ouverture manuelle)
     * @param openedBy  id utilisateur qui ouvre le dossier
     * @param cause     description de la cause (texte libre)
     * @param level     niveau d'alerte associe
     * @return id du dossier cree
     * @throws IllegalStateException si un dossier OPEN ou INVESTIGATING existe deja pour
     *         cet {@code alertId} (interdit la double-ouverture sur la meme alerte).
     */
    Long openCase(Long workerId, Long alertId, Long openedBy, String cause, AlertLevel level);

    /**
     * Mise en investigation : ajoute les actions correctives et la decision medicale.
     *
     * @param caseId             id du dossier (statut courant doit etre OPEN ou INVESTIGATING)
     * @param correctiveActions  texte libre
     * @param medicalDecision    texte libre (rempli par le medecin du travail)
     * @param actorId            id utilisateur effectuant l'action
     * @throws IllegalStateException si le statut courant est CLOSED
     */
    void addInvestigation(Long caseId, String correctiveActions, String medicalDecision, Long actorId);

    /**
     * Cloture d'un dossier de surexposition.
     *
     * @param caseId                id du dossier
     * @param authorityDeclaration  flag declaration aux autorites
     * @param actorId               id utilisateur (typiquement PCR/RPO)
     * @param closureNote           commentaire libre
     * @throws IllegalStateException si le statut courant est deja CLOSED
     */
    void closeCase(Long caseId, boolean authorityDeclaration, Long actorId, String closureNote);

    /** Liste tous les dossiers d'un travailleur, du plus recent au plus ancien. */
    List<OverexposureCaseDTO> findByWorker(Long workerId);

    /** Liste les dossiers actifs (OPEN ou INVESTIGATING) pour une mine donnee. */
    List<OverexposureCaseDTO> findActive(Long mineId);
}
