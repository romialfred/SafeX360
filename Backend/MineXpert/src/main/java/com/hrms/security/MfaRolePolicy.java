package com.hrms.security;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

/** Politique centrale des roles pour lesquels la MFA est obligatoire. */
@Component
public class MfaRolePolicy {

    // Les roles d'administration viennent de la SOURCE UNIQUE AdminRoles —
    // les redeclarer ici recreerait la duplication qui avait produit la
    // regression « 403 pour tous les administrateurs ». Seuls les roles
    // metier NON admin soumis a la MFA sont listes localement.
    private static final Set<String> PRIVILEGED_ROLES = java.util.stream.Stream.concat(
            AdminRoles.ALIASES.stream(),
            Set.of(
            "HEALTH_SAFETY_COORDINATOR", "HSE_MANAGER", "HSE_OFFICER",
            "MEDECIN", "MEDICAL_DOCTOR", "DOCTOR", "PHYSICIAN",
            "PCR", "RPO", "PCR_RPO", "DOSIMETRY_MEDICAL",
            "RESPONSABLE_DYNAMITAGE", "BLAST_MANAGER", "BLAST_RESPONSIBLE",
            "BLAST_SUPERVISOR", "BLAST_ADMIN", "BLAST_OFFICER").stream())
            .collect(java.util.stream.Collectors.toUnmodifiableSet());

    public boolean requiresMfa(String role) {
        // 2FA OBLIGATOIRE POUR TOUS LES COMPTES (décision sécurité) : tout rôle non
        // vide impose l'enrôlement puis la vérification MFA. À la première connexion,
        // après le changement du mot de passe, l'enrôlement 2FA est donc forcé quel
        // que soit le rôle ; aux connexions suivantes, la vérification TOTP est exigée.
        // (Historique : seuls PRIVILEGED_ROLES étaient soumis — conservé pour trace.)
        return role != null && !role.isBlank();
    }

    static String normalize(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        return Normalizer.normalize(role, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
    }
}
