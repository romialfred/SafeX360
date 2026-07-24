package com.minexpert.hns.policy.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.policy.dto.HsPolicyAcknowledgementDTO;
import com.minexpert.hns.policy.dto.HsPolicyArticleDTO;
import com.minexpert.hns.policy.dto.HsPolicyDTO;
import com.minexpert.hns.policy.entity.HsPolicy;
import com.minexpert.hns.policy.entity.HsPolicyAcknowledgement;
import com.minexpert.hns.policy.entity.HsPolicyArticle;
import com.minexpert.hns.policy.enums.HsPolicyStatus;
import com.minexpert.hns.policy.repository.HsPolicyAcknowledgementRepository;
import com.minexpert.hns.policy.repository.HsPolicyArticleRepository;
import com.minexpert.hns.policy.repository.HsPolicyRepository;
import com.minexpert.hns.utility.AuthUtils;

import lombok.RequiredArgsConstructor;

/**
 * Règles métier de la politique SST (ISO 45001 §5.2/§5.4).
 *
 * <p>Deux invariants opposables portés ICI (jamais seulement dans l'IHM) :
 * une politique <b>publiée est figée</b> (preuve non altérable), et l'<b>identité
 * du signataire comme du travailleur</b> qui prend connaissance vient du jeton
 * authentifié, jamais du corps de requête (non-répudiation §5.2/§5.4).
 */
@Service
@RequiredArgsConstructor
public class HsPolicyServiceImpl implements HsPolicyService {

    private final HsPolicyRepository policyRepository;
    private final HsPolicyArticleRepository articleRepository;
    private final HsPolicyAcknowledgementRepository ackRepository;

    /**
     * Une politique appartient à UNE mine : companyId est obligatoire et positif.
     * Doctrine plateforme — pas d'écriture ni de lecture « toutes mines » ici :
     * une politique consolidée n'a pas de sens (chaque site engage sa direction).
     */
    private Long requireCompany(Long companyId) throws HSException {
        if (companyId == null || companyId <= 0) {
            throw new HSException("COMPANY_REQUIRED");
        }
        return companyId;
    }

    private List<HsPolicyArticleDTO> articlesOf(Long policyId) {
        return articleRepository.findByPolicyIdOrderByOrderIndexAsc(policyId).stream()
                .map(HsPolicyArticleDTO::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HsPolicyDTO getPublished(Long companyId) throws HSException {
        Long company = requireCompany(companyId);
        HsPolicy published = policyRepository
                .findFirstByCompanyIdAndStatusOrderByVersionDesc(company, HsPolicyStatus.PUBLISHED)
                .orElse(null);
        if (published == null) {
            return null; // aucune politique publiée pour cette mine
        }
        HsPolicyDTO dto = HsPolicyDTO.fromEntity(published, articlesOf(published.getId()));
        Long accountId = AuthUtils.currentActorId();
        if (accountId != null) {
            ackRepository.findByPolicyIdAndAccountId(published.getId(), accountId).ifPresent(ack -> {
                dto.setAcknowledged(true);
                dto.setAcknowledgedAt(ack.getAcknowledgedAt());
            });
        }
        if (dto.getAcknowledged() == null) {
            dto.setAcknowledged(false);
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HsPolicyDTO> list(Long companyId) throws HSException {
        Long company = requireCompany(companyId);
        List<HsPolicyDTO> out = new ArrayList<>();
        for (HsPolicy p : policyRepository.findByCompanyIdOrderByVersionDesc(company)) {
            // Liste = en-têtes ; les articles sont chargés au détail (getById).
            out.add(HsPolicyDTO.fromEntity(p, List.of()));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public HsPolicyDTO getById(Long companyId, Long id) throws HSException {
        Long company = requireCompany(companyId);
        HsPolicy p = policyRepository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
        return HsPolicyDTO.fromEntity(p, articlesOf(p.getId()));
    }

    @Override
    @Transactional
    public HsPolicyDTO saveDraft(Long companyId, HsPolicyDTO dto) throws HSException {
        Long company = requireCompany(companyId);
        HsPolicy policy;
        if (dto.getId() != null) {
            policy = policyRepository.findByIdAndCompanyId(dto.getId(), company)
                    .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
            // Une politique publiée est une preuve figée : on ne la réécrit pas.
            // Pour la réviser, l'IHM crée un NOUVEAU brouillon (id nul).
            if (policy.getStatus() != HsPolicyStatus.DRAFT) {
                throw new HSException("POLICY_LOCKED");
            }
        } else {
            policy = new HsPolicy();
            policy.setCompanyId(company);
            policy.setStatus(HsPolicyStatus.DRAFT);
            policy.setCreatedAt(LocalDateTime.now());
        }
        policy.setTitle(dto.getTitle());
        policy.setPreamble(dto.getPreamble());
        policy.setEffectiveDate(dto.getEffectiveDate());
        policy.setUpdatedAt(LocalDateTime.now());
        HsPolicy saved = policyRepository.save(policy);

        // Articles : on remplace intégralement le jeu (édition simple et sans dérive).
        articleRepository.deleteByPolicyId(saved.getId());
        List<HsPolicyArticleDTO> articles = dto.getArticles() != null ? dto.getArticles() : List.of();
        int index = 0;
        for (HsPolicyArticleDTO a : articles) {
            HsPolicyArticle entity = new HsPolicyArticle();
            entity.setPolicyId(saved.getId());
            entity.setCompanyId(company);
            entity.setOrderIndex(index++);
            entity.setTitle(a.getTitle());
            entity.setBody(a.getBody());
            entity.setExplanation(a.getExplanation());
            articleRepository.save(entity);
        }
        return HsPolicyDTO.fromEntity(saved, articlesOf(saved.getId()));
    }

    @Override
    @Transactional
    public void deleteDraft(Long companyId, Long id) throws HSException {
        Long company = requireCompany(companyId);
        HsPolicy policy = policyRepository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
        if (policy.getStatus() != HsPolicyStatus.DRAFT) {
            throw new HSException("POLICY_LOCKED");
        }
        articleRepository.deleteByPolicyId(id);
        policyRepository.delete(policy);
    }

    @Override
    @Transactional
    public HsPolicyDTO publish(Long companyId, Long id, String signatoryName, String signatoryTitle,
            String signatureImage) throws HSException {
        Long company = requireCompany(companyId);
        HsPolicy policy = policyRepository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
        if (policy.getStatus() != HsPolicyStatus.DRAFT) {
            throw new HSException("POLICY_ALREADY_PUBLISHED");
        }
        if (signatoryName == null || signatoryName.isBlank()) {
            throw new HSException("SIGNATORY_REQUIRED");
        }
        // Une politique SST sans engagement n'engage rien : on refuse de publier un
        // document vide (§5.2 — la politique EST une liste d'engagements).
        if (articleRepository.findByPolicyIdOrderByOrderIndexAsc(id).isEmpty()) {
            throw new HSException("POLICY_HAS_NO_ARTICLE");
        }

        // Une seule version publiée par mine : on archive la précédente.
        policyRepository.findFirstByCompanyIdAndStatusOrderByVersionDesc(company, HsPolicyStatus.PUBLISHED)
                .ifPresent(previous -> {
                    previous.setStatus(HsPolicyStatus.ARCHIVED);
                    previous.setUpdatedAt(LocalDateTime.now());
                    policyRepository.save(previous);
                });

        int nextVersion = policyRepository.findFirstByCompanyIdOrderByVersionDesc(company)
                .map(p -> p.getVersion() == null ? 1 : p.getVersion() + 1)
                .orElse(1);

        policy.setVersion(nextVersion);
        policy.setStatus(HsPolicyStatus.PUBLISHED);
        policy.setSignatoryName(signatoryName.trim());
        policy.setSignatoryTitle(signatoryTitle != null ? signatoryTitle.trim() : null);
        policy.setSignatureImage(signatureImage);
        policy.setSignedAt(LocalDateTime.now());
        // Identité non répudiable : l'employé authentifié qui publie (jamais le corps).
        policy.setSignedByEmpId(AuthUtils.currentEmpId());
        if (policy.getEffectiveDate() == null) {
            policy.setEffectiveDate(java.time.LocalDate.now());
        }
        policy.setUpdatedAt(LocalDateTime.now());
        HsPolicy saved = policyRepository.save(policy);
        return HsPolicyDTO.fromEntity(saved, articlesOf(saved.getId()));
    }

    @Override
    @Transactional
    public HsPolicyDTO acknowledge(Long companyId, Long id, String displayName) throws HSException {
        Long company = requireCompany(companyId);
        HsPolicy policy = policyRepository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
        if (policy.getStatus() != HsPolicyStatus.PUBLISHED) {
            // On ne prend connaissance que d'une politique EN VIGUEUR.
            throw new HSException("POLICY_NOT_PUBLISHED");
        }
        Long accountId = AuthUtils.currentActorId();
        if (accountId == null) {
            throw new HSException("IDENTITY_REQUIRED");
        }
        // Idempotent : reconfirmer ne crée pas de doublon (contrainte d'unicité + garde).
        ackRepository.findByPolicyIdAndAccountId(id, accountId).orElseGet(() -> {
            HsPolicyAcknowledgement ack = new HsPolicyAcknowledgement();
            ack.setPolicyId(id);
            ack.setCompanyId(company);
            ack.setAccountId(accountId);
            ack.setEmpId(AuthUtils.currentEmpId());
            ack.setName(displayName != null && !displayName.isBlank() ? displayName.trim() : null);
            ack.setAcknowledgedAt(LocalDateTime.now());
            return ackRepository.save(ack);
        });
        return getPublished(company);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HsPolicyAcknowledgementDTO> acknowledgements(Long companyId, Long id) throws HSException {
        Long company = requireCompany(companyId);
        policyRepository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
        return ackRepository.findByPolicyIdOrderByAcknowledgedAtDesc(id).stream()
                .map(HsPolicyAcknowledgementDTO::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> acknowledgementStats(Long companyId, Long id) throws HSException {
        Long company = requireCompany(companyId);
        policyRepository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new HSException("POLICY_NOT_FOUND"));
        Map<String, Object> stats = new LinkedHashMap<>();
        // On rapporte le nombre RÉEL de prises de connaissance. On n'invente pas de
        // dénominateur « effectif total » qu'on ne peut pas calculer de façon fiable
        // ici (il relève du SIRH) — un taux fabriqué tromperait la revue de direction.
        stats.put("acknowledged", ackRepository.countByPolicyId(id));
        return stats;
    }
}
