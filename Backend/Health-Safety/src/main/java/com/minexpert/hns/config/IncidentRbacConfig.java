package com.minexpert.hns.config;

/**
 * Catalogue centralisé des autorités RBAC de gouvernance du module Incidents
 * (matrice RACI — ISO 45001 §5.3 rôles/responsabilités, §10.2 revue).
 *
 * <p>Ces constantes sont référencées par les annotations {@code @PreAuthorize}
 * (autorité brute, {@code hasAuthority('X')}) et par les gardes de service qui
 * ne peuvent pas passer par une annotation (voir
 * {@code IncidentServiceImpl.assertCloseAuthority} — la clôture est une action
 * conditionnée par le statut cible sur un endpoint de transition partagé).
 *
 * <p><b>IMPORTANT — couplage passerelle ↔ HNS :</b> une autorité n'existe côté
 * HNS que si la passerelle la frappe dans le bundle du rôle
 * ({@code GatewayMS TokenFilter.ROLE_PERMISSIONS}). Ces deux autorités sont
 * accordées aux rôles <b>« Accountable »</b> — coordinateur/manager HSE
 * ({@code HEALTH_SAFETY_COORDINATOR / HSE_MANAGER / HSE_OFFICER}) et
 * administrateurs — mais <b>PAS</b> à l'investigateur, l'auditeur ni l'employé
 * (« Responsible / Consulted / Informed »). L'investigateur mène l'enquête ; il
 * ne signe pas sa propre revue et ne prononce pas la clôture. Déployer la
 * passerelle et HNS <b>ensemble</b> (sinon fail-closed : personne ne peut
 * valider/clôturer).
 */
public final class IncidentRbacConfig {

    private IncidentRbacConfig() {
    }

    /**
     * Valider une enquête d'incident (revue par un pair indépendant, §10.2) —
     * prérequis à la clôture. Réservé aux rôles « Accountable ». L'indépendance
     * vis-à-vis de l'équipe d'enquête est vérifiée en plus au niveau service
     * ({@code validateInvestigation} → VALIDATOR_MUST_BE_INDEPENDENT).
     */
    public static final String INCIDENT_VALIDATE = "INCIDENT_VALIDATE";

    /**
     * Prononcer la clôture d'un incident (statut CLOSED). Réservé aux rôles
     * « Accountable ». Les autres transitions de statut (déclaration, mise en
     * enquête…) restent ouvertes selon la matrice d'autorisation transversale.
     */
    public static final String INCIDENT_CLOSE = "INCIDENT_CLOSE";
}
