package com.hrms.activity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.dto.AuditLogDTO;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.security.AdminGuard;
import com.hrms.service.AuditLogService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * FICHE UTILISATEUR — lecture consolidee et pilotage du second facteur.
 *
 * <p>Alimente les onglets de la fiche : identite professionnelle, historique des
 * connexions, activite (pages et actions), etat de securite du compte.
 *
 * <p>Chaque endpoint passe par {@link AdminGuard} : ces donnees decrivent le
 * comportement d'une personne, elles ne sont pas consultables par ses collegues.
 */
@RestController
@CrossOrigin
@RequestMapping("/admin/users")
public class UserProfileController {

    /** Bornes de pagination : evite qu'un appel unique ne ramene tout l'historique. */
    private static final int MAX_PAGE_SIZE = 200;

    private final AdminGuard adminGuard;
    private final AccountRepository accounts;
    private final UserSessionRepository sessions;
    private final UserActivityRepository activities;
    private final ActivityService activity;
    private final AuditLogService auditLogService;

    public UserProfileController(AdminGuard adminGuard, AccountRepository accounts,
            UserSessionRepository sessions, UserActivityRepository activities,
            ActivityService activity, AuditLogService auditLogService) {
        this.adminGuard = adminGuard;
        this.accounts = accounts;
        this.sessions = sessions;
        this.activities = activities;
        this.activity = activity;
        this.auditLogService = auditLogService;
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /{id}/overview — en-tete de la fiche
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/overview")
    public ResponseEntity<?> overview(@PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        adminGuard.requireAdmin(token, request);
        Account account = account(id);
        activity.closeStaleSessions();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", account.getId());
        body.put("login", account.getLogin());
        body.put("name", account.getName());
        body.put("email", account.getEmail());
        body.put("phoneNumber", account.getPhoneNumber());
        body.put("role", account.getRole());
        body.put("status", account.getStatus());
        body.put("identitySource", account.getIdentitySource());
        body.put("firstLogin", Boolean.TRUE.equals(account.getFirstLogin()));
        body.put("startDate", account.getStartDate());
        body.put("endDate", account.getEndDate());
        body.put("company", nameOf(account.getCompany() == null ? null : account.getCompany().getName()));
        body.put("companyId", account.getCompany() == null ? null : account.getCompany().getId());
        body.put("position", nameOf(account.getPosition() == null ? null : account.getPosition().getName()));
        body.put("department", nameOf(account.getDepartment() == null ? null : account.getDepartment().getName()));
        body.put("employeeId", account.getEmployee() == null ? null : account.getEmployee().getId());
        body.put("allMinesAccess", Boolean.TRUE.equals(account.getAllMinesAccess()));
        body.put("assignedCompanies", account.getAssignedCompanies() == null ? List.of()
                : account.getAssignedCompanies().stream().map(c -> Map.of("id", c.getId(), "name", c.getName())).toList());

        // Etat du second facteur : on distingue « enrole » (drapeau ET secret) de
        // « dispense » — deux realites differentes que confondre serait trompeur.
        Map<String, Object> mfa = new LinkedHashMap<>();
        mfa.put("required", !Boolean.TRUE.equals(account.getMfaExempt()));
        mfa.put("exempt", Boolean.TRUE.equals(account.getMfaExempt()));
        mfa.put("enrolled", account.isMfaEnrolled());
        mfa.put("enrolledAt", account.getMfaEnrolledAt());
        body.put("mfa", mfa);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("sessions", sessions.countByAccountId(id));
        stats.put("pages", activities.countByAccountIdAndKind(id, UserActivity.Kind.PAGE.name()));
        stats.put("actions", activities.countByAccountIdAndKind(id, UserActivity.Kind.ACTION.name()));
        sessions.findByAccountIdOrderByStartedAtDesc(id, PageRequest.of(0, 1)).stream().findFirst()
                .ifPresent(last -> {
                    stats.put("lastLoginAt", last.getStartedAt());
                    stats.put("lastLoginIp", last.getIpAddress());
                    stats.put("sessionOpen", last.getEndedAt() == null);
                });
        body.put("stats", stats);
        return ResponseEntity.ok(body);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /{id}/sessions — historique des connexions
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/sessions")
    public ResponseEntity<?> sessions(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        adminGuard.requireAdmin(token, request);
        account(id);
        activity.closeStaleSessions();

        Page<UserSession> result = sessions.findByAccountIdOrderByStartedAtDesc(id,
                PageRequest.of(Math.max(page, 0), clampSize(size)));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (UserSession session : result) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", session.getId());
            row.put("startedAt", session.getStartedAt());
            row.put("endedAt", session.getEndedAt());
            row.put("endReason", session.getEndReason());
            row.put("lastSeenAt", session.getLastSeenAt());
            row.put("open", session.getEndedAt() == null);
            row.put("ipAddress", session.getIpAddress());
            row.put("userAgent", session.getUserAgent());
            row.put("mfaUsed", Boolean.TRUE.equals(session.getMfaUsed()));
            row.put("companyId", session.getCompanyId());
            rows.add(row);
        }
        return ResponseEntity.ok(Map.of("content", rows, "total", result.getTotalElements(),
                "page", result.getNumber(), "size", result.getSize()));
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /{id}/activity — pages consultees et actions
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/activity")
    public ResponseEntity<?> activity(@PathVariable Long id,
            @RequestParam(required = false) String kind,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        adminGuard.requireAdmin(token, request);
        account(id);

        PageRequest pageable = PageRequest.of(Math.max(page, 0), clampSize(size));
        Page<UserActivity> result = (kind == null || kind.isBlank())
                ? activities.findByAccountIdOrderByOccurredAtDesc(id, pageable)
                : activities.findByAccountIdAndKindOrderByOccurredAtDesc(id,
                        kind.trim().toUpperCase(java.util.Locale.ROOT), pageable);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (UserActivity item : result) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", item.getId());
            row.put("occurredAt", item.getOccurredAt());
            row.put("kind", item.getKind());
            row.put("actionType", item.getActionType());
            row.put("method", item.getMethod());
            row.put("path", item.getPath());
            row.put("label", item.getLabel());
            row.put("statusCode", item.getStatusCode());
            row.put("sessionId", item.getSessionId());
            row.put("source", item.getSource());
            row.put("ipAddress", item.getIpAddress());
            rows.add(row);
        }
        return ResponseEntity.ok(Map.of("content", rows, "total", result.getTotalElements(),
                "page", result.getNumber(), "size", result.getSize()));
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /{id}/mfa/enable|disable — pilotage du second facteur
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Retire la dispense : le compte redevient soumis au second facteur et devra
     * s'enroler a sa prochaine connexion (aucune session en cours n'est coupee).
     */
    @PostMapping("/{id}/mfa/enable")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> enableMfa(@PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        String performedBy = adminGuard.requireAdmin(token, request);
        Account account = account(id);
        account.setMfaExempt(false);
        accounts.save(account);
        audit(performedBy, "MFA enabled (exemption removed) for " + account.getLogin());
        return ResponseEntity.ok(Map.of(
                "accountId", id,
                "mfaRequired", true,
                "enrolled", account.isMfaEnrolled(),
                "message", account.isMfaEnrolled()
                        ? "Second facteur exigé — ce compte est déjà enrôlé."
                        : "Second facteur exigé — l'enrôlement sera demandé à la prochaine connexion."));
    }

    /**
     * Pose la dispense et EFFACE le secret : laisser un secret derriere une
     * dispense produirait un compte a la fois dispense et enrole, dont on ne
     * saurait plus dire s'il est protege. Reactiver imposera un nouvel enrolement.
     *
     * <p>Un administrateur ne peut pas se dispenser LUI-MEME : c'est la porte
     * ouverte a la suppression silencieuse de sa propre protection, et le premier
     * geste de quelqu'un ayant vole une session d'administrateur.
     */
    @PostMapping("/{id}/mfa/disable")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> disableMfa(@PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        Account admin = adminGuard.adminOrNull(token);
        if (admin == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Accès réservé aux administrateurs (SYSTEM_ADMINISTRATOR)");
        }
        Account account = account(id);
        if (admin.getId() != null && admin.getId().equals(account.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "CANNOT_DISABLE_OWN_MFA",
                    "errorMessage", "Vous ne pouvez pas retirer votre propre second facteur. "
                            + "Demandez à un autre administrateur."));
        }
        account.setMfaExempt(true);
        account.setMfaEnabled(false);
        account.setMfaSecretEncrypted(null);
        account.setMfaRecoveryCodeHashes(null);
        account.setMfaLastAcceptedStep(null);
        account.setMfaEnrolledAt(null);
        accounts.save(account);
        audit(admin.getLogin(), "MFA disabled (exemption granted) for " + account.getLogin());
        return ResponseEntity.ok(Map.of(
                "accountId", id,
                "mfaRequired", false,
                "enrolled", false,
                "message", "Second facteur désactivé pour ce compte. Le secret existant a été effacé."));
    }

    // ─────────────────────────────────────────────────────────────────────
    // OUTILS
    // ─────────────────────────────────────────────────────────────────────

    private Account account(Long id) {
        return accounts.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND"));
    }

    private static int clampSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    private static String nameOf(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private void audit(String performedBy, String message) {
        try {
            auditLogService.logAudit(new AuditLogDTO(null, null, performedBy, LocalDateTime.now(), message));
        } catch (Exception ignored) {
            // Journaliser ne doit jamais faire echouer l'action journalisee.
        }
    }
}
