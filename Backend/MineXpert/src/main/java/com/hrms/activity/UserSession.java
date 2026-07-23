package com.hrms.activity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Une session de connexion, ouverte a l'authentification reussie et fermee a la
 * deconnexion.
 *
 * <p>La session est la racine de la tracabilite : chaque page visitee et chaque
 * action enregistree s'y rattachent. Elle est ecrite par le SERVEUR au moment ou
 * il delivre le cookie — un client ne peut donc pas fabriquer de session ni en
 * masquer une.
 *
 * <p>Deliberement sans lien JPA vers Account : la tracabilite doit survivre a la
 * suppression d'un compte (on garde l'identifiant et le login pour l'audit).
 */
@Entity
@Table(name = "user_session", indexes = {
        @Index(name = "idx_user_session_account", columnList = "account_id"),
        @Index(name = "idx_user_session_started", columnList = "started_at")
})
public class UserSession {

    /** Comment la session s'est terminee. */
    public enum EndReason { LOGOUT, EXPIRED, SUPERSEDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "login", length = 255)
    private String login;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "end_reason", length = 20)
    private String endReason;

    /** Derniere activite observee — sert a estimer la duree d'une session non fermee. */
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    /** Vrai si un second facteur a ete presente pour ouvrir cette session. */
    @Column(name = "mfa_used")
    private Boolean mfaUsed;

    /** Mine active a l'ouverture de session (peut etre nulle). */
    @Column(name = "company_id")
    private Long companyId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    public String getEndReason() { return endReason; }
    public void setEndReason(String endReason) { this.endReason = endReason; }
    public LocalDateTime getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(LocalDateTime lastSeenAt) { this.lastSeenAt = lastSeenAt; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Boolean getMfaUsed() { return mfaUsed; }
    public void setMfaUsed(Boolean mfaUsed) { this.mfaUsed = mfaUsed; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
}
