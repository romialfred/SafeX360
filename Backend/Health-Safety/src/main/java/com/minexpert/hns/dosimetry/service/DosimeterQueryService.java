package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.util.List;

import com.minexpert.hns.dosimetry.dto.DosimeterDetailDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterListItemDTO;
import com.minexpert.hns.dosimetry.dto.SearchDosimeterFiltersDTO;

/**
 * Service de requetes metier sur le parc de dosimetres.
 *
 * <p>Distinct du service CRUD historique ({@link DosimeterService}) pour separer la couche query
 * read-only (recherche multi-criteres, vue detail 360, alertes etalonnage) des operations de
 * gestion d'affectation (handover / return) qui modifient l'etat du parc.
 *
 * <p>Les operations d'affectation tracent systematiquement un audit log via
 * {@link DosimetryAuditService} pour conformite reglementaire (tracabilite de la chaine de
 * possession des dosimetres).
 */
public interface DosimeterQueryService {

    /**
     * Recherche multi-criteres dans le parc. Tous les criteres sont optionnels (null = pas de
     * restriction) sauf mineId qui est obligatoire (multi-tenant).
     *
     * <p>Le tri par defaut est serial ASC. Les filtres {@code search} (serial/qrCode) et
     * {@code calibrationDueWithinDays} sont appliques en post-projection apres le SELECT JPA.
     */
    List<DosimeterListItemDTO> searchDosimeters(SearchDosimeterFiltersDTO filters);

    /**
     * Fiche 360 d'un dosimetre : entite de base + assignment actif (si present) + historique
     * complet des assignments + placeholder pour l'historique d'etalonnage.
     */
    DosimeterDetailDTO getDosimeterDetail(Long id);

    /**
     * Affecte un dosimetre a un travailleur (handover).
     *
     * <p>Verifie : (1) le dosimetre existe et est AVAILABLE, (2) aucune affectation active
     * (returnAck=false) n'existe deja sur ce dosimetre. Cree la DosimeterAssignment avec
     * handoverAck=true / handoverAckAt=now, bascule dosimeter.status -&gt; ASSIGNED, et
     * journalise un audit log {@code action=CREATE entityType=DosimeterAssignment}.
     *
     * @return id de l'affectation creee
     * @throws IllegalStateException si dosimetre non AVAILABLE ou affectation active existante
     */
    Long assignToWorker(Long dosimeterId, Long workerId, LocalDate periodStart, LocalDate periodEnd,
            String handoverNote, Long actorId);

    /**
     * Acquitte le retour d'un dosimetre par son porteur.
     *
     * <p>Verifie que l'affectation existe et n'est pas deja acquittee (returnAck=false), pose
     * returnAck=true / returnAckAt=now / deviceCondition, bascule le statut du dosimetre vers
     * IN_READING (le badge va etre lu par le laboratoire), et journalise un audit log.
     *
     * @throws IllegalStateException si l'affectation est introuvable ou deja acquittee
     */
    void returnFromWorker(Long assignmentId, String deviceCondition, Long actorId);

    /**
     * Liste des dosimetres dont l'echeance d'etalonnage est dans les 30 jours (ou deja depassee),
     * a l'exclusion des dosimetres RETIRED. Filtre par mine.
     */
    List<DosimeterListItemDTO> calibrationAlerts(Long mineId);
}
