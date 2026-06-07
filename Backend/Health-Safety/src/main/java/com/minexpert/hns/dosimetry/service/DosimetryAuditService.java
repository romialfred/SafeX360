package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;

import lombok.RequiredArgsConstructor;

/**
 * Helper d'ecriture des entrees d'audit du module Dosimetrie.
 *
 * <p><b>Difference avec {@link DosimetryAuditLogService} :</b> ce dernier est un service CRUD
 * "metier" (DTO, recherche, liste...). Ce helper est destine a etre injecte partout dans le
 * module pour ecrire des traces de maniere ergonomique, avec une transaction propre
 * ({@link Propagation#REQUIRES_NEW}) afin que l'audit soit COMMIT meme si la transaction
 * parente rollback (ex. levee d'AccessDeniedException apres lecture nominative).
 *
 * <p><b>Cas d'usage :</b>
 *
 * <pre>{@code
 * auditService.log("VIEW_NOMINATIVE_DOSE", "DoseRecord", recordId, currentUserId,
 *                  "DOSIMETRY_READ_NOMINATIVE", "{\"period\":\"2026-01\"}");
 * }</pre>
 *
 * <p>Resistance aux erreurs : si l'INSERT d'audit echoue (FK, contrainte, BDD down...), on
 * logge en SLF4J pour permettre l'analyse forensique cote APM et on AVALE l'exception. Audit
 * = best-effort ; il ne doit jamais provoquer l'echec d'une operation metier deja validee.
 */
@Service
@RequiredArgsConstructor
public class DosimetryAuditService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DosimetryAuditService.class);

    private final DosimetryAuditLogRepository auditRepository;

    /**
     * Ecrit une entree d'audit dans une transaction independante.
     *
     * @param action       cle d'action (CREATE | READ | UPDATE | VIEW_NOMINATIVE_DOSE | EXPORT ...)
     * @param entityType   type de l'entite concernee (ex. {@code "DoseRecord"})
     * @param entityId     id de l'entite (peut etre null pour une action sur un ensemble)
     * @param userId       id utilisateur effectif au moment de l'action
     * @param permissions  liste des permissions effectives (CSV ou JSON), pour audit RBAC
     * @param details      payload JSON libre (parametres d'export, champs lus, etc.)
     * @return l'id du log cree, ou {@code null} si la persistance a echoue
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long log(String action,
                    String entityType,
                    Long entityId,
                    Long userId,
                    String permissions,
                    String details) {
        return log(action, entityType, entityId, userId, permissions, null, details);
    }

    /**
     * Variante avec adresse IP (pour les acces depuis le web).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long log(String action,
                    String entityType,
                    Long entityId,
                    Long userId,
                    String permissions,
                    String ipAddress,
                    String details) {
        try {
            DosimetryAuditLog entry = DosimetryAuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .userId(userId)
                    .userPermissions(permissions)
                    .timestamp(LocalDateTime.now())
                    .ipAddress(ipAddress)
                    .details(details)
                    .build();
            return auditRepository.save(entry).getId();
        } catch (Exception ex) {
            LOGGER.error("[DosimetryAuditService] Audit log persistence FAILED "
                            + "(action={}, entityType={}, entityId={}, userId={}) : {}",
                    action, entityType, entityId, userId, ex.getMessage(), ex);
            return null;
        }
    }
}
