package com.hrms.activity;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Ecriture de la tracabilite : ouverture/fermeture de session, pages consultees,
 * actions metier.
 *
 * <p>REGLE CARDINALE : tracer ne doit JAMAIS casser l'action tracee. Une panne
 * d'ecriture de trace n'a pas a empecher quelqu'un de se connecter ou d'enregistrer
 * un incident. Toutes les methodes publiques avalent donc leurs exceptions apres
 * les avoir journalisees — c'est un choix assume, pas un oubli.
 */
@Service
public class ActivityService {

    private static final Logger LOG = LoggerFactory.getLogger(ActivityService.class);

    /** Au-dela de cette inactivite, une session ouverte est consideree perdue. */
    private static final Duration STALE_AFTER = Duration.ofHours(12);

    private final UserSessionRepository sessions;
    private final UserActivityRepository activities;

    public ActivityService(UserSessionRepository sessions, UserActivityRepository activities) {
        this.sessions = sessions;
        this.activities = activities;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SESSIONS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Ouvre une session apres une authentification reussie. Appele la ou le cookie
     * est delivre — donc a chaque chemin d'entree (connexion directe, verification
     * du second facteur, premiere connexion).
     */
    @Transactional
    public Long openSession(Long accountId, String login, boolean mfaUsed, Long companyId,
            HttpServletRequest request) {
        try {
            if (accountId == null) {
                return null;
            }
            // Une nouvelle connexion supplante la precedente restee ouverte : sans
            // cela, un utilisateur qui se reconnecte accumulerait des sessions
            // « ouvertes » qui ne se fermeront jamais.
            sessions.findFirstByAccountIdAndEndedAtIsNullOrderByStartedAtDesc(accountId)
                    .ifPresent(previous -> {
                        previous.setEndedAt(LocalDateTime.now());
                        previous.setEndReason(UserSession.EndReason.SUPERSEDED.name());
                        sessions.save(previous);
                    });

            UserSession session = new UserSession();
            session.setAccountId(accountId);
            session.setLogin(login);
            session.setStartedAt(LocalDateTime.now());
            session.setLastSeenAt(LocalDateTime.now());
            session.setMfaUsed(mfaUsed);
            session.setCompanyId(companyId);
            session.setIpAddress(clientIp(request));
            session.setUserAgent(truncate(header(request, "User-Agent"), 512));
            return sessions.save(session).getId();
        } catch (Exception e) {
            LOG.warn("Ouverture de session non tracee pour {} : {}", login, e.getMessage());
            return null;
        }
    }

    /** Ferme la session ouverte d'un compte (deconnexion explicite). */
    @Transactional
    public void closeSession(Long accountId, UserSession.EndReason reason) {
        try {
            if (accountId == null) {
                return;
            }
            sessions.findFirstByAccountIdAndEndedAtIsNullOrderByStartedAtDesc(accountId)
                    .ifPresent(session -> {
                        session.setEndedAt(LocalDateTime.now());
                        session.setEndReason(reason.name());
                        sessions.save(session);
                    });
        } catch (Exception e) {
            LOG.warn("Fermeture de session non tracee pour accountId={} : {}", accountId, e.getMessage());
        }
    }

    /** Cloture les sessions abandonnees. Declenche a la lecture, sans tache planifiee. */
    @Transactional
    public void closeStaleSessions() {
        try {
            LocalDateTime now = LocalDateTime.now();
            sessions.closeStale(now, now.minus(STALE_AFTER));
        } catch (Exception e) {
            LOG.warn("Cloture des sessions perimees impossible : {}", e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // ACTIVITE
    // ─────────────────────────────────────────────────────────────────────

    /** Trace une page consultee (declaree par le client). */
    @Transactional
    public void recordPage(Long accountId, String login, String path, String label, String source,
            HttpServletRequest request) {
        record(accountId, login, UserActivity.Kind.PAGE, null, path, null, label, null, source, request);
    }

    /** Trace une action metier constatee cote serveur. */
    @Transactional
    public void recordAction(Long accountId, String login, String method, String path, String label,
            Integer statusCode, String ip) {
        try {
            UserActivity activity = base(accountId, login, UserActivity.Kind.ACTION);
            activity.setActionType(actionTypeFor(method, path).name());
            activity.setMethod(method);
            activity.setPath(truncate(path, 512));
            activity.setLabel(truncate(label, 255));
            activity.setStatusCode(statusCode);
            activity.setIpAddress(truncate(ip, 64));
            activity.setSource("SERVER");
            persist(activity);
        } catch (Exception e) {
            LOG.warn("Action non tracee ({} {}) : {}", method, path, e.getMessage());
        }
    }

    private void record(Long accountId, String login, UserActivity.Kind kind, String method, String path,
            Integer statusCode, String label, String actionType, String source, HttpServletRequest request) {
        try {
            UserActivity activity = base(accountId, login, kind);
            activity.setMethod(method);
            activity.setPath(truncate(path, 512));
            activity.setLabel(truncate(label, 255));
            activity.setStatusCode(statusCode);
            activity.setActionType(actionType);
            activity.setSource(source == null ? "WEB" : source);
            activity.setIpAddress(clientIp(request));
            persist(activity);
        } catch (Exception e) {
            LOG.warn("Activite non tracee ({}) : {}", path, e.getMessage());
        }
    }

    private UserActivity base(Long accountId, String login, UserActivity.Kind kind) {
        UserActivity activity = new UserActivity();
        activity.setAccountId(accountId);
        activity.setLogin(login);
        activity.setKind(kind.name());
        activity.setOccurredAt(LocalDateTime.now());
        activity.setSessionId(currentSessionId(accountId));
        return activity;
    }

    private void persist(UserActivity activity) {
        activities.save(activity);
        // Toute trace vaut signe de vie : la duree d'une session non fermee reste
        // ainsi realiste meme sans deconnexion explicite.
        if (activity.getSessionId() != null) {
            sessions.findById(activity.getSessionId()).ifPresent(session -> {
                session.setLastSeenAt(activity.getOccurredAt());
                sessions.save(session);
            });
        }
    }

    private Long currentSessionId(Long accountId) {
        if (accountId == null) {
            return null;
        }
        Optional<UserSession> open = sessions.findFirstByAccountIdAndEndedAtIsNullOrderByStartedAtDesc(accountId);
        return open.map(UserSession::getId).orElse(null);
    }

    /**
     * Nature de l'action a partir du verbe et du chemin. La validation est un cas
     * particulier de mise a jour, mais c'est l'acte le plus scrute d'un audit :
     * on le distingue explicitement.
     */
    static UserActivity.ActionType actionTypeFor(String method, String path) {
        String verb = method == null ? "" : method.toUpperCase(Locale.ROOT);
        String lower = path == null ? "" : path.toLowerCase(Locale.ROOT);
        if (lower.contains("valid") || lower.contains("approve") || lower.contains("close")
                || lower.contains("verify") || lower.contains("sign")) {
            return UserActivity.ActionType.VALIDATE;
        }
        return switch (verb) {
            case "POST" -> UserActivity.ActionType.CREATE;
            case "PUT", "PATCH" -> UserActivity.ActionType.UPDATE;
            case "DELETE" -> UserActivity.ActionType.DELETE;
            default -> UserActivity.ActionType.OTHER;
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // OUTILS
    // ─────────────────────────────────────────────────────────────────────

    private static String header(HttpServletRequest request, String name) {
        return request == null ? null : request.getHeader(name);
    }

    /**
     * Adresse du client. Derriere la passerelle et le CDN, l'adresse directe est
     * celle du proxy : on prend la premiere entree de X-Forwarded-For, qui est
     * l'adresse d'origine.
     */
    static String clientIpOf(String forwardedFor, String remoteAddr) {
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isEmpty()) {
                return truncate(first, 64);
            }
        }
        return truncate(remoteAddr, 64);
    }

    private static String clientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return clientIpOf(request.getHeader("X-Forwarded-For"), request.getRemoteAddr());
    }

    static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
