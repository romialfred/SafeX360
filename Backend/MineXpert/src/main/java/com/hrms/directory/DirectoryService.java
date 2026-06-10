package com.hrms.directory;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.repository.AccountRepository;

/**
 * LOT 52 — service d'accès à l'annuaire (Active Directory via LDAP/LDAPS, ou
 * annuaire simulé en mode démo).
 *
 * Implémentation LDAP en JNDI pur (JDK) : aucune dépendance supplémentaire.
 *   - search()       : recherche paginée (max 20) avec le compte de service.
 *   - authenticate() : résolution du DN de l'utilisateur puis bind avec SES
 *                      identifiants — le mot de passe n'est jamais stocké.
 *
 * Sécurité : les caractères spéciaux des filtres LDAP sont échappés
 * (anti-injection RFC 4515).
 */
@Service
public class DirectoryService {

    private static final Logger LOG = LoggerFactory.getLogger(DirectoryService.class);
    private static final int MAX_RESULTS = 20;

    @Autowired
    private DirectorySettingsRepository settingsRepository;
    @Autowired
    private DirectoryCrypto crypto;
    @Autowired
    private AccountRepository accountRepository;

    /** Configuration courante (créée avec les défauts au premier accès). */
    public DirectorySettings getSettings() {
        return settingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> settingsRepository.save(DirectorySettings.defaults()));
    }

    public boolean isEnabled() {
        DirectorySettings s = getSettings();
        return Boolean.TRUE.equals(s.getEnabled());
    }

    public boolean isDemoMode() {
        return Boolean.TRUE.equals(getSettings().getDemoMode());
    }

    /** Recherche d'utilisateurs dans l'annuaire + marquage de ceux déjà importés. */
    public List<DirectoryUserDTO> search(String query) {
        DirectorySettings s = getSettings();
        if (!Boolean.TRUE.equals(s.getEnabled())) {
            throw new IllegalStateException("DIRECTORY_DISABLED");
        }
        List<DirectoryUserDTO> results = Boolean.TRUE.equals(s.getDemoMode())
                ? DemoDirectory.search(query)
                : ldapSearch(s, query);
        results.forEach(u -> u.setAlreadyImported(
                accountRepository.findByLogin(u.getLogin()).isPresent()));
        return results;
    }

    /**
     * Authentification déléguée d'un compte ACTIVE_DIRECTORY.
     * Retourne true si l'annuaire (réel ou démo) valide les identifiants.
     */
    public boolean authenticate(String login, String password) {
        if (password == null || password.isEmpty()) return false;
        DirectorySettings s = getSettings();
        if (!Boolean.TRUE.equals(s.getEnabled())) return false;
        if (Boolean.TRUE.equals(s.getDemoMode())) {
            return DemoDirectory.authenticate(login, password);
        }
        return ldapAuthenticate(s, login, password);
    }

    /** Test de connexion LDAP avec la configuration fournie (avant sauvegarde). */
    public String testConnection(DirectorySettings s, String bindPasswordPlain) {
        if (Boolean.TRUE.equals(s.getDemoMode())) {
            return "Mode démo actif : " + DemoDirectory.search("").size() + " utilisateurs simulés disponibles.";
        }
        try {
            InitialDirContext ctx = openContext(s, s.getBindDn(), bindPasswordPlain);
            ctx.close();
            return "Connexion LDAP réussie à " + s.getHost() + ":" + s.getPort();
        } catch (Exception e) {
            throw new IllegalStateException("LDAP_CONNECTION_FAILED: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LDAP (JNDI)
    // ─────────────────────────────────────────────────────────────────────

    private List<DirectoryUserDTO> ldapSearch(DirectorySettings s, String query) {
        List<DirectoryUserDTO> out = new ArrayList<>();
        try {
            InitialDirContext ctx = openContext(s, s.getBindDn(), crypto.decrypt(s.getBindPasswordEnc()));
            try {
                String q = escapeLdap(query == null ? "" : query.trim());
                String filter = q.isEmpty()
                        ? "(&(objectClass=user)(" + s.getAttrLogin() + "=*))"
                        : "(&(objectClass=user)(|(" + s.getAttrLogin() + "=*" + q + "*)("
                            + s.getAttrEmail() + "=*" + q + "*)(" + s.getAttrName() + "=*" + q + "*)))";
                SearchControls controls = new SearchControls();
                controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
                controls.setCountLimit(MAX_RESULTS);
                controls.setReturningAttributes(new String[]{
                        s.getAttrLogin(), s.getAttrEmail(), s.getAttrName(), s.getAttrDepartment(), "title"});

                NamingEnumeration<SearchResult> answer = ctx.search(s.getBaseDn(), filter, controls);
                while (answer.hasMore() && out.size() < MAX_RESULTS) {
                    Attributes a = answer.next().getAttributes();
                    out.add(new DirectoryUserDTO(
                            attr(a, s.getAttrLogin()),
                            attr(a, s.getAttrEmail()),
                            attr(a, s.getAttrName()),
                            attr(a, s.getAttrDepartment()),
                            attr(a, "title"),
                            false));
                }
            } finally {
                ctx.close();
            }
        } catch (Exception e) {
            LOG.warn("Recherche LDAP en echec: {}", e.getMessage());
            throw new IllegalStateException("LDAP_SEARCH_FAILED: " + e.getMessage());
        }
        return out;
    }

    private boolean ldapAuthenticate(DirectorySettings s, String login, String password) {
        try {
            // 1. Résoudre le DN de l'utilisateur avec le compte de service
            InitialDirContext service = openContext(s, s.getBindDn(), crypto.decrypt(s.getBindPasswordEnc()));
            String userDn = null;
            try {
                SearchControls controls = new SearchControls();
                controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
                controls.setCountLimit(1);
                NamingEnumeration<SearchResult> answer = service.search(
                        s.getBaseDn(),
                        "(&(objectClass=user)(" + s.getAttrLogin() + "=" + escapeLdap(login) + "))",
                        controls);
                if (answer.hasMore()) {
                    userDn = answer.next().getNameInNamespace();
                }
            } finally {
                service.close();
            }
            if (userDn == null) return false;

            // 2. Bind avec les identifiants de l'utilisateur = authentification
            InitialDirContext userCtx = openContext(s, userDn, password);
            userCtx.close();
            return true;
        } catch (Exception e) {
            LOG.info("Authentification LDAP refusee pour {}: {}", login, e.getMessage());
            return false;
        }
    }

    private InitialDirContext openContext(DirectorySettings s, String principal, String credentials) throws Exception {
        Hashtable<String, String> env = new Hashtable<>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        String scheme = Boolean.TRUE.equals(s.getUseSsl()) ? "ldaps" : "ldap";
        env.put(Context.PROVIDER_URL, scheme + "://" + s.getHost() + ":" + s.getPort());
        env.put(Context.SECURITY_AUTHENTICATION, "simple");
        env.put(Context.SECURITY_PRINCIPAL, principal);
        env.put(Context.SECURITY_CREDENTIALS, credentials);
        env.put("com.sun.jndi.ldap.connect.timeout", "5000");
        env.put("com.sun.jndi.ldap.read.timeout", "10000");
        return new InitialDirContext(env);
    }

    private String attr(Attributes a, String name) throws Exception {
        if (name == null || a.get(name) == null) return null;
        Object v = a.get(name).get();
        return v != null ? v.toString() : null;
    }

    /** Échappement RFC 4515 des filtres LDAP (anti-injection). */
    static String escapeLdap(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case '\\': sb.append("\\5c"); break;
                case '*':  sb.append("\\2a"); break;
                case '(':  sb.append("\\28"); break;
                case ')':  sb.append("\\29"); break;
                case '\0': sb.append("\\00"); break;
                default:   sb.append(c);
            }
        }
        return sb.toString();
    }
}
