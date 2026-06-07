package com.minexpert.hns.dosimetry.service;

import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;

/**
 * Generation de documents PDF officiels du module Dosimetrie (Phase 9).
 *
 * <p>Chaque methode :
 * <ul>
 *   <li>charge les donnees agregees / nominatives selon le besoin,</li>
 *   <li>rend un template Thymeleaf (XHTML strict),</li>
 *   <li>convertit via Flying Saucer + OpenPDF en byte[] PDF,</li>
 *   <li>logge une trace d'audit avec le motif RGPD pour les rapports nominatifs.</li>
 * </ul>
 *
 * <p><b>Reglementaire :</b> tous les PDF incluent une mention de pied de page "CIPR 103 /
 * AIEA GSR Part 3" et un watermark CONFIDENTIEL pour les rapports nominatifs / medicaux. Le
 * nom du fichier est genere selon une convention stable utilisable par les systemes
 * documentaires aval.
 */
public interface DosimetryReportService {

    /**
     * Genere une attestation individuelle de dose pour un travailleur sur une annee donnee.
     *
     * <p>Contenu : identite (workerId / employeeId), doses annuelles Hp(10) / Hp(0,07) / Hp(3),
     * cumul 5 ans glissant, aptitude courante. Pas de donnees cliniques sensibles : le PDF est
     * destine au travailleur, au PCR/RPO et a l'inspection du travail.
     *
     * @param workerId    id du travailleur
     * @param year        annee de reference
     * @param requesterId id utilisateur effectuant la demande (audit)
     * @param reason      motif RGPD (obligatoire pour piste d'audit, ne peut etre vide)
     * @return PDF dans un DTO porteur du filename et du content-type
     */
    DosimetryReportDocumentDTO generateIndividualDoseAttestation(Long workerId, int year,
            Long requesterId, String reason);

    /**
     * Genere une synthese de carriere : toutes les doses depuis l'embauche, l'historique des
     * aptitudes (PUBLIC, pas de details cliniques) et le cumul vie entiere.
     */
    DosimetryReportDocumentDTO generateCareerSummary(Long workerId, Long requesterId,
            String reason);

    /**
     * Genere le registre annuel d'une mine : tableau des travailleurs exposes, dose annuelle
     * Hp(10), pourcentage de la limite reglementaire, aptitude. Stats agregees en fin de
     * tableau.
     *
     * <p>Ce registre est agregge mais comporte une ligne par worker (employeeId + dose).
     * L'audit est trace avec entityType=Mine et entityId=mineId.
     */
    DosimetryReportDocumentDTO generateAnnualMineRegister(Long mineId, int year,
            Long requesterId);

    /**
     * Genere le dossier complet d'un cas de surexposition : ouverture, investigation,
     * decision medicale, cloture, declaration aux autorites. Inclut un encart "cause" et
     * "actions correctives".
     */
    DosimetryReportDocumentDTO generateOverexposureReport(Long caseId, Long requesterId,
            String reason);
}
