/**
 * Miroir FRONT du mapping rôle → autorité de gouvernance Incidents (ISO 45001
 * §10.2 · RACI) fait par la passerelle (GatewayMS TokenFilter). Sert UNIQUEMENT à
 * masquer les contrôles que l'utilisateur n'a pas le droit d'actionner (UX) : la
 * sécurité RÉELLE reste serveur (@PreAuthorize + fail-closed), qui renvoie 403.
 * On duplique ici la liste des rôles « Accountable » — à garder synchronisée avec
 * ADMIN_PERMS / COORDINATOR_PERMS de la passerelle.
 *
 * Portent INCIDENT_VALIDATE / INCIDENT_CLOSE : admins + coordinateur/manager/
 * officier HSE. PAS l'investigateur (mène l'enquête mais ne la signe pas), ni
 * l'auditeur, ni l'employé.
 */
const ACCOUNTABLE_ROLES = new Set<string>([
  'SYSTEM_ADMINISTRATOR',
  'ADMINISTRATOR',
  'ADMIN',
  'HEALTH_SAFETY_COORDINATOR',
  'HSE_MANAGER',
  'HSE_OFFICER',
]);

/** Normalisation alignée sur la passerelle (MAJ, trim, '-'/' ' → '_'). */
const normalizeRole = (role?: string | null): string =>
  (role || '').trim().toUpperCase().replace(/[-\s]/g, '_');

/**
 * Vrai si le rôle porte la gouvernance Incidents (valider une enquête, poser le
 * statut réglementaire, clôturer). Rôle inconnu/employé → false (fail-closed UX).
 */
export const isIncidentAccountable = (role?: string | null): boolean =>
  ACCOUNTABLE_ROLES.has(normalizeRole(role));
