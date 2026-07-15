package com.minexpert.hns.service.audit;

import org.springframework.stereotype.Component;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.AuditChecklistItem;
import com.minexpert.hns.entity.audit.Auditor;
import com.minexpert.hns.entity.audit.EffectivenessCheck;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.entity.audit.Report;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditChecklistItemRepository;
import com.minexpert.hns.repository.audit.AuditRepository;
import com.minexpert.hns.repository.audit.AuditorRepository;
import com.minexpert.hns.repository.audit.EffectivenessCheckRepository;
import com.minexpert.hns.repository.audit.ObservationRepository;
import com.minexpert.hns.repository.audit.RecommendationRepository;
import com.minexpert.hns.repository.audit.ReportRepository;

import lombok.RequiredArgsConstructor;

/**
 * Cloisonnement par mine — garde d'appartenance pour les lectures ciblées du
 * module Audits (par id direct ou par audit parent).
 *
 * <p>La garde est invoquée dans les controllers <b>avant</b> l'appel au service
 * (donc avant tout accès au cache) : elle rejette toute lecture d'une ressource
 * appartenant à une autre mine. Comme un audit / rapport / recommandation
 * appartient à exactement une mine, les caches indexés par {@code auditId} /
 * {@code id} ne peuvent pas divulguer de données inter-mines une fois l'accès
 * gardé en amont.</p>
 *
 * <p>Convention : {@code companyId == null} = appel système / allMines =
 * aucun contrôle. Message d'erreur volontairement « introuvable » pour ne pas
 * divulguer l'existence d'une ressource d'une autre mine (ids énumérables).</p>
 */
@Component
@RequiredArgsConstructor
public class AuditOwnershipGuard {

    private final AuditRepository auditRepository;
    private final ReportRepository reportRepository;
    private final RecommendationRepository recommendationRepository;
    private final AuditorRepository auditorRepository;
    private final AuditChecklistItemRepository checklistItemRepository;
    private final ObservationRepository observationRepository;
    private final EffectivenessCheckRepository effectivenessCheckRepository;

    /** Vérifie que l'audit parent appartient à la mine (lectures par auditId). */
    public void assertAuditCompany(Long auditId, Long companyId) throws HSException {
        if (companyId == null || auditId == null) {
            return;
        }
        Long owner = auditRepository.findById(auditId).map(Audit::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("AUDIT_NOT_FOUND");
        }
    }

    /** Vérifie qu'un rapport d'audit appartient à la mine (lecture par id). */
    public void assertReportCompany(Long reportId, Long companyId) throws HSException {
        if (companyId == null || reportId == null) {
            return;
        }
        Long owner = reportRepository.findById(reportId).map(Report::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("REPORT_NOT_FOUND");
        }
    }

    /** Vérifie qu'une recommandation appartient à la mine (lecture par id). */
    public void assertRecommendationCompany(Long recommendationId, Long companyId) throws HSException {
        if (companyId == null || recommendationId == null) {
            return;
        }
        Long owner = recommendationRepository.findById(recommendationId)
                .map(Recommendation::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("RECOMMENDATION_NOT_FOUND");
        }
    }

    /** Vérifie qu'un auditeur appartient à la mine (mutations par id d'auditeur). */
    public void assertAuditorCompany(Long auditorId, Long companyId) throws HSException {
        if (companyId == null || auditorId == null) {
            return;
        }
        Long owner = auditorRepository.findById(auditorId).map(Auditor::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("AUDITOR_NOT_FOUND");
        }
    }

    /**
     * Vérifie qu'une question de checklist appartient à la mine (mutations par id
     * d'item), via l'audit parent qui porte le companyId.
     */
    public void assertChecklistItemCompany(Long itemId, Long companyId) throws HSException {
        if (companyId == null || itemId == null) {
            return;
        }
        Long auditId = checklistItemRepository.findById(itemId)
                .map(AuditChecklistItem::getAuditId).orElse(null);
        if (auditId == null) {
            throw new HSException("CHECKLIST_ITEM_NOT_FOUND");
        }
        Long owner = auditRepository.findById(auditId).map(Audit::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("CHECKLIST_ITEM_NOT_FOUND");
        }
    }

    /** Vérifie qu'un constat appartient à la mine (mutations par id de constat). */
    public void assertObservationCompany(Long observationId, Long companyId) throws HSException {
        if (companyId == null || observationId == null) {
            return;
        }
        Long owner = observationRepository.findById(observationId)
                .map(Observation::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("OBSERVATION_NOT_FOUND");
        }
    }

    /**
     * Vérifie qu'une vérification d'efficacité appartient à la mine (mutations par
     * id de check).
     */
    public void assertEffectivenessCheckCompany(Long checkId, Long companyId) throws HSException {
        if (companyId == null || checkId == null) {
            return;
        }
        Long owner = effectivenessCheckRepository.findById(checkId)
                .map(EffectivenessCheck::getCompanyId).orElse(null);
        if (owner == null || !companyId.equals(owner)) {
            throw new HSException("EFFECTIVENESS_CHECK_NOT_FOUND");
        }
    }
}
