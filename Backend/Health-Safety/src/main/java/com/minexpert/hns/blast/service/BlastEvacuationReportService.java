package com.minexpert.hns.blast.service;

import java.util.List;
import java.util.Optional;

import com.minexpert.hns.blast.dto.BlastEvacuationReportDTO;

/**
 * Service du rapport d'evacuation post-tir (P6).
 *
 * <p>Cycle de vie d'un rapport :
 * <ol>
 *   <li>Cree automatiquement lors du passage du tir en {@code ALL_CLEAR}
 *       (cf. {@link BlastService#allClear(Long, Long)}). Si un rapport existe
 *       deja pour le tir, l'appel est un no-op idempotent.</li>
 *   <li>Edite par l'agent HSE : ajout d'incidents via
 *       {@link #addIncident(Long, String, Long)} tant que le rapport n'est
 *       pas signe.</li>
 *   <li>Signe par un agent disposant de la permission {@code BLAST_REPORT}
 *       via {@link #sign(Long, Long, String)}. Apres signature, le rapport
 *       devient strictement append-only : le service refuse toute mutation
 *       sur {@code incidents}, {@code musteredCount}, {@code missingCount}
 *       (defense applicative ; la BDD applique la meme regle via triggers).</li>
 *   <li>Telecharge en PDF via
 *       {@link #renderPdf(Long, String)} (template Thymeleaf bilingue
 *       {@code blast/evacuation_report}).</li>
 * </ol>
 *
 * <p>Les comptages presents / manquants sont issus du service
 * {@link com.minexpert.hns.api.emergency.service.GeneralAlertService} si une
 * alerte generale ACTIVE / ENDED couvre le creneau du tir. Le service ne
 * reimplemente pas le head-count.
 */
public interface BlastEvacuationReportService {

    /**
     * Cree (idempotent) le rapport d'evacuation associe a un tir cloture
     * en {@code ALL_CLEAR}. Si un rapport existe deja pour ce tir, il est
     * retourne sans modification.
     *
     * @param blastId id du tir
     * @return DTO du rapport (existant ou nouvellement cree)
     */
    BlastEvacuationReportDTO createReport(Long blastId);

    /**
     * Signe le rapport. Verrouille en lecture-seule les champs
     * {@code incidents}, {@code musteredCount}, {@code missingCount} a partir
     * de cet instant.
     *
     * @param reportId           id du rapport
     * @param signedByUserId     id de l'utilisateur signataire
     * @param signatureDataBase64 empreinte canvas optionnelle (data URL PNG)
     * @return DTO du rapport mis a jour
     * @throws IllegalStateException si le rapport est deja signe
     */
    BlastEvacuationReportDTO sign(Long reportId, Long signedByUserId, String signatureDataBase64);

    /**
     * Ajoute un incident au rapport. Concatene la description au champ
     * {@code incidents} avec un timestamp et l'acteur. Rejete si le rapport
     * est deja signe.
     *
     * @param reportId            id du rapport
     * @param incidentDescription description libre de l'incident
     * @param actorId             id de l'utilisateur saisissant
     * @return DTO du rapport mis a jour
     * @throws IllegalStateException si le rapport est deja signe
     */
    BlastEvacuationReportDTO addIncident(Long reportId, String incidentDescription, Long actorId);

    /** Recupere le rapport d'un tir (optional). */
    Optional<BlastEvacuationReportDTO> getByBlastId(Long blastId);

    /** Recupere un rapport par son id. */
    Optional<BlastEvacuationReportDTO> getById(Long reportId);

    /**
     * Liste les rapports d'une mine (utilise par la liste cote frontend ou
     * les tableaux de bord HSE). Tri implicite : plus recents en premier.
     */
    List<BlastEvacuationReportDTO> search(Long mineId);

    /**
     * Rend le rapport au format PDF (Thymeleaf + OpenPDF).
     *
     * @param reportId id du rapport
     * @param lang     {@code "fr"} ou {@code "en"} ({@code null} = "fr")
     * @return bytes du PDF (commence par les octets magiques {@code %PDF-})
     */
    byte[] renderPdf(Long reportId, String lang);

    // ── Surcharges cloisonnees par mine (companyId) ─────────────────────────
    // companyId (valide par CompanyScopeFilter) verifie que le rapport releve
    // bien de la mine appelante (via blast.mineId). null = pas de controle.

    default List<BlastEvacuationReportDTO> search(Long mineId, Long companyId) {
        return search(companyId != null ? companyId : mineId);
    }

    default Optional<BlastEvacuationReportDTO> getByBlastId(Long blastId, Long companyId) {
        return getByBlastId(blastId);
    }

    default Optional<BlastEvacuationReportDTO> getById(Long reportId, Long companyId) {
        return getById(reportId);
    }

    default BlastEvacuationReportDTO sign(Long reportId, Long signedByUserId,
            String signatureDataBase64, Long companyId) {
        return sign(reportId, signedByUserId, signatureDataBase64);
    }

    default BlastEvacuationReportDTO addIncident(Long reportId, String incidentDescription,
            Long actorId, Long companyId) {
        return addIncident(reportId, incidentDescription, actorId);
    }

    default byte[] renderPdf(Long reportId, String lang, Long companyId) {
        return renderPdf(reportId, lang);
    }
}
