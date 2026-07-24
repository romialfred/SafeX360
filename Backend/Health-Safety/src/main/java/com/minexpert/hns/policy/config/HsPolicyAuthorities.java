package com.minexpert.hns.policy.config;

/**
 * Autorité RBAC du module Politique SST (ISO 45001 §5.2).
 *
 * <p>Publier/signer une politique est un acte de DIRECTION : réservé aux rôles
 * « management » (Administrator/SYSTEM_ADMINISTRATOR, HSE_MANAGER/HSE_OFFICER/
 * HEALTH_SAFETY_COORDINATOR), auxquels la passerelle accorde cette autorité.
 * La lecture de la politique publiée et la prise de connaissance (§5.4) restent
 * ouvertes à tout utilisateur authentifié — c'est même l'objectif : que chaque
 * travailleur y accède.
 */
public final class HsPolicyAuthorities {

    private HsPolicyAuthorities() { }

    public static final String MANAGE = "HS_POLICY_MANAGE";
}
