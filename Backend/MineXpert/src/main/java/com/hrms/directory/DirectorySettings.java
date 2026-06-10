package com.hrms.directory;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — configuration du connecteur Active Directory / LDAP (ligne unique).
 *
 * Deux modes :
 *   - demoMode=true  : annuaire simulé réaliste (aucun serveur requis) — permet
 *     de démontrer l'import AD de bout en bout tant qu'aucun annuaire n'est branché.
 *   - demoMode=false : connexion LDAP/LDAPS réelle avec compte de service
 *     (mot de passe chiffré AES-256-GCM, jamais en clair en base).
 */
@Entity
@Table(name = "directory_settings")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DirectorySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Connecteur actif (recherche + authentification déléguée autorisées). */
    private Boolean enabled;

    /** true = annuaire simulé ; false = LDAP réel. */
    private Boolean demoMode;

    private String host;
    private Integer port;
    private Boolean useSsl;

    /** Base de recherche, ex. DC=minexpert,DC=local */
    private String baseDn;

    /** DN du compte de service en lecture seule. */
    private String bindDn;

    /** Mot de passe du compte de service, chiffré AES-256-GCM (DirectoryCrypto). */
    @Column(length = 1024)
    private String bindPasswordEnc;

    /** Mapping des attributs AD (défauts Microsoft AD). */
    private String attrLogin;       // sAMAccountName
    private String attrEmail;       // mail
    private String attrName;        // displayName
    private String attrDepartment;  // department

    private LocalDateTime updatedAt;
    private String updatedBy;

    public static DirectorySettings defaults() {
        DirectorySettings s = new DirectorySettings();
        s.setEnabled(true);
        s.setDemoMode(true);
        s.setUseSsl(true);
        s.setPort(636);
        s.setAttrLogin("sAMAccountName");
        s.setAttrEmail("mail");
        s.setAttrName("displayName");
        s.setAttrDepartment("department");
        s.setUpdatedAt(LocalDateTime.now());
        return s;
    }
}
