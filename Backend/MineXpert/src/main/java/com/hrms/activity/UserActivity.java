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
 * Une trace d'activite : page consultee ou action metier.
 *
 * <p>Deux natures, deux niveaux de confiance — et c'est volontairement explicite :
 * <ul>
 *   <li>{@code PAGE} : navigation dans l'application. Une application monopage
 *       navigue sans appeler le serveur ; cette trace est donc DECLAREE PAR LE
 *       CLIENT. On l'enregistre au nom de l'utilisateur authentifie (jamais au nom
 *       d'un autre) mais elle vaut ce que vaut le client.</li>
 *   <li>{@code ACTION} : creation, modification, validation, suppression. Trace
 *       CONSTATEE PAR LE SERVEUR a partir du trafic reellement passe par la
 *       passerelle — un client ne peut ni l'inventer ni l'omettre.</li>
 * </ul>
 * Un audit qui melangerait les deux sans le dire donnerait a une declaration de
 * client la meme valeur qu'a un fait serveur.
 */
@Entity
@Table(name = "user_activity", indexes = {
        @Index(name = "idx_user_activity_account", columnList = "account_id"),
        @Index(name = "idx_user_activity_at", columnList = "occurred_at"),
        @Index(name = "idx_user_activity_session", columnList = "session_id")
})
public class UserActivity {

    public enum Kind { PAGE, ACTION }

    /** Nature de l'action metier, deduite du verbe HTTP. */
    public enum ActionType { CREATE, UPDATE, DELETE, VALIDATE, OTHER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "login", length = 255)
    private String login;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "kind", length = 16, nullable = false)
    private String kind;

    @Column(name = "action_type", length = 16)
    private String actionType;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    /** Route IHM pour une page, chemin d'API pour une action. */
    @Column(name = "path", length = 512)
    private String path;

    @Column(name = "method", length = 10)
    private String method;

    /** Libelle lisible (titre de page, ou module vise par l'action). */
    @Column(name = "label", length = 255)
    private String label;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    /** WEB, MOBILE ou SERVER selon l'origine de la trace. */
    @Column(name = "source", length = 16)
    private String source;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Integer getStatusCode() { return statusCode; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
