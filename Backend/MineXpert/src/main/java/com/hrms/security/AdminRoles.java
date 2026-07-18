package com.hrms.security;

import java.util.Set;

/**
 * SOURCE DE VERITE UNIQUE des roles consideres comme administrateurs.
 *
 * <p><b>Pourquoi cette classe existe.</b> Deux definitions de « admin »
 * coexistaient dans HRMS : {@code AdminUserController} acceptait
 * SYSTEM_ADMINISTRATOR / ADMINISTRATOR / ADMIN, tandis que la garde de
 * {@code AccountAPI} n'acceptait que ADMIN / SUPER_ADMIN. Or les roles
 * REELLEMENT presents en base sont Administrator, SYSTEM_ADMINISTRATOR,
 * HSE_MANAGER, HSE_OFFICER et EMPLOYEE : ni ADMIN ni SUPER_ADMIN n'existent.
 * La seconde garde refusait donc TOUT LE MONDE, y compris les administrateurs
 * legitimes — l'ecran de gestion des utilisateurs renvoyait 403.
 *
 * <p>Le defaut n'etait pas la liste elle-meme mais sa DUPLICATION : deux listes
 * divergent toujours. Toute garde d'administration doit passer par ici.
 *
 * <p><b>Comparaison en MAJUSCULES</b> : la base stocke « Administrator »
 * (capitalise) tandis que la gateway normalise en « ADMINISTRATOR ». Comparer
 * sans normaliser est precisement ce qui a casse.
 */
public final class AdminRoles {

    /** Alias acceptes comme administrateur, en MAJUSCULES. */
    public static final Set<String> ALIASES = Set.of(
            "SYSTEM_ADMINISTRATOR",
            "ADMINISTRATOR",
            "ADMIN");

    private AdminRoles() {
        // classe utilitaire
    }

    /** Vrai si le role fourni (quelle que soit sa casse) est un role d'administration. */
    public static boolean isAdmin(String role) {
        return role != null && ALIASES.contains(role.trim().toUpperCase());
    }
}
