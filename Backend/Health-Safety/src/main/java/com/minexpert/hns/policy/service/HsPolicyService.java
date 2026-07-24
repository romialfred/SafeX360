package com.minexpert.hns.policy.service;

import java.util.List;
import java.util.Map;

import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.policy.dto.HsPolicyAcknowledgementDTO;
import com.minexpert.hns.policy.dto.HsPolicyDTO;

public interface HsPolicyService {

    /** Politique publiée courante de la mine + état de prise de connaissance de l'appelant. */
    HsPolicyDTO getPublished(Long companyId) throws HSException;

    /** Toutes les versions de la mine (management). */
    List<HsPolicyDTO> list(Long companyId) throws HSException;

    /** Une politique précise + ses articles (management). */
    HsPolicyDTO getById(Long companyId, Long id) throws HSException;

    /** Crée ou met à jour un BROUILLON (une politique publiée est figée). */
    HsPolicyDTO saveDraft(Long companyId, HsPolicyDTO dto) throws HSException;

    /** Supprime un brouillon (jamais une version publiée/archivée). */
    void deleteDraft(Long companyId, Long id) throws HSException;

    /** Signe et publie : archive la version publiée précédente, incrémente la version. */
    HsPolicyDTO publish(Long companyId, Long id, String signatoryName, String signatoryTitle,
            String signatureImage) throws HSException;

    /** Le travailleur courant prend connaissance de la politique (§5.4). Idempotent. */
    HsPolicyDTO acknowledge(Long companyId, Long id, String displayName) throws HSException;

    /** Liste des prises de connaissance d'une politique (management, §9.3). */
    List<HsPolicyAcknowledgementDTO> acknowledgements(Long companyId, Long id) throws HSException;

    /** Statistiques de diffusion pour la revue de direction (§9.3). */
    Map<String, Object> acknowledgementStats(Long companyId, Long id) throws HSException;
}
