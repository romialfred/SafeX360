package com.minexpert.hns.dosimetry.util;

import java.util.Collection;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.service.DosimetryAuditService;

import lombok.RequiredArgsConstructor;

/**
 * Composant util de controle d'acces SELF cote serveur (Phase 10-A - durcissement RGPD).
 *
 * <p><b>Contexte :</b> les endpoints {@code /by-worker/{workerId}} de Dosimetrie sont
 * accessibles aux roles eleves (RPO, MEDICAL, PCR_RPO) MAIS aussi au travailleur lui-meme
 * (mode SELF). Avant Phase 10-A, l'enforcement SELF etait uniquement frontend (le frontend
 * ne montrait que les boutons accedant a son propre id). Un utilisateur malveillant pouvait
 * neanmoins forger une requete avec un {@code workerId} different et acceder aux donnees
 * d'un collegue (le serveur ne verifiait pas).
 *
 * <p><b>Garde serveur :</b> {@link #verifySelfAccess(Long, Long)} :
 * <ul>
 *   <li>retourne {@code true} si l'appelant porte une permission ELEVEE
 *       ({@code DOSIMETRY_MEDICAL}, {@code DOSIMETRY_PCR_RPO},
 *       {@code DOSIMETRY_READ_AGGREGATE}, etc.) : pas de restriction SELF a appliquer ;</li>
 *   <li>retourne {@code true} si {@code ExposedWorker.employeeId == requesterUserId}
 *       (le travailleur consulte ses propres donnees) ;</li>
 *   <li>jette {@link AccessDeniedException} sinon, apres avoir trace une entree d'audit
 *       {@code ACCESS_DENIED_SELF_MISMATCH} avec les details (workerId cible, requesterId,
 *       employeeId du worker) pour analyse forensique.</li>
 * </ul>
 *
 * <p>Le nom {@code Guard} traduit son role d'invariant defensif : aucune lecture nominative
 * ne doit jamais traverser cette frontiere sans avoir ete validee.
 *
 * <p>Conformite : RGPD art. 32 (security of processing), art. 30 (registry of activities -
 * via audit log). AIEA GSR Part 3 §3.106 (medical confidentiality).
 */
@Component
@RequiredArgsConstructor
public class DosimetrySelfAccessGuard {

    private static final Logger LOGGER = LoggerFactory.getLogger(DosimetrySelfAccessGuard.class);

    /**
     * Permissions qui exonerent du controle SELF (acces eleve par role metier).
     */
    private static final String[] ELEVATED_PERMISSIONS = new String[] {
            DosimetryRBACConfig.DOSIMETRY_MEDICAL,
            DosimetryRBACConfig.DOSIMETRY_PCR_RPO,
            DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE,
            DosimetryRBACConfig.DOSIMETRY_ADMIN,
            DosimetryRBACConfig.DOSIMETRY_EXPORT_MEDICAL
    };

    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditService auditService;

    /**
     * Verifie qu'un appelant peut acceder aux donnees du travailleur cible.
     *
     * @param workerId        id de l'ExposedWorker dont on demande les donnees
     * @param requesterUserId id utilisateur effectif (header X-User-Id - peut etre null)
     * @return {@code true} si l'acces est autorise (cas SELF match ou role eleve)
     * @throws AccessDeniedException si {@code workerId} ne correspond pas au requester et
     *         que celui-ci n'a pas de permission elevee
     */
    public boolean verifySelfAccess(Long workerId, Long requesterUserId) {
        // 1) Si l'appelant porte une permission elevee, on autorise sans verifier SELF.
        if (hasAnyElevatedAuthority()) {
            return true;
        }

        // 2) Mode SELF strict : requesterUserId requis.
        if (requesterUserId == null) {
            logDenied(workerId, null, null, "MISSING_USER_ID");
            throw new AccessDeniedException(
                    "SELF access denied : missing X-User-Id header and no elevated permission.");
        }
        if (workerId == null) {
            logDenied(null, requesterUserId, null, "MISSING_WORKER_ID");
            throw new AccessDeniedException("SELF access denied : missing workerId.");
        }

        Optional<ExposedWorker> opt = workerRepository.findById(workerId);
        if (opt.isEmpty()) {
            // Worker introuvable : on ne leak pas l'existence, on rejette via SELF mismatch.
            logDenied(workerId, requesterUserId, null, "WORKER_NOT_FOUND");
            throw new AccessDeniedException("SELF access denied : worker not accessible.");
        }
        Long employeeId = opt.get().getEmployeeId();
        if (employeeId == null || !employeeId.equals(requesterUserId)) {
            logDenied(workerId, requesterUserId, employeeId, "EMPLOYEE_ID_MISMATCH");
            throw new AccessDeniedException(
                    "SELF access denied : worker " + workerId + " does not belong to requester.");
        }
        return true;
    }

    /**
     * Variante sans levee d'exception : utile aux services qui veulent simplement degrader
     * la reponse (ex. renvoyer un DTO Public au lieu d'un Full).
     *
     * @return {@code true} si l'acces SELF est valide ou si l'appelant a une permission elevee.
     */
    public boolean isSelfOrElevated(Long workerId, Long requesterUserId) {
        try {
            return verifySelfAccess(workerId, requesterUserId);
        } catch (AccessDeniedException ex) {
            return false;
        }
    }

    /**
     * Verifie si l'authentification courante porte au moins une des permissions elevees.
     * Retourne {@code false} si aucun SecurityContext n'est positionne (cas d'un test unitaire
     * sans filtre, fallback safe).
     */
    boolean hasAnyElevatedAuthority() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
        if (authorities == null || authorities.isEmpty()) {
            return false;
        }
        for (GrantedAuthority granted : authorities) {
            String name = granted.getAuthority();
            for (String elevated : ELEVATED_PERMISSIONS) {
                if (elevated.equals(name)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void logDenied(Long workerId, Long requesterUserId, Long actualEmployeeId, String reason) {
        String details = String.format(
                "{\"workerId\":%s,\"requesterUserId\":%s,\"actualEmployeeId\":%s,\"reason\":\"%s\"}",
                workerId, requesterUserId, actualEmployeeId, reason);
        LOGGER.warn("[DosimetrySelfAccessGuard] ACCESS_DENIED_SELF_MISMATCH {}", details);
        auditService.log("ACCESS_DENIED_SELF_MISMATCH", "ExposedWorker", workerId,
                requesterUserId != null ? requesterUserId : 0L, null, details);
    }
}
