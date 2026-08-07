/**
 * MIROIR CLIENT de la table d'autorités du gateway (GatewayMS TokenFilter.java,
 * `ROLE_PERMISSIONS`). Les permissions fines HNS (BLAST_*, INSPECTION_*,
 * DOSIMETRY_*, INCIDENT_*) sont dérivées du RÔLE côté gateway et injectées en
 * `X-Permissions` ; le JWT côté client ne porte PAS cette liste. Ce miroir permet
 * à l'IHM de refléter fidèlement les mêmes droits (affichage/masquage des actions),
 * là où des helpers locaux divergents lisaient un tableau de permissions inexistant.
 *
 * ⚠ SOURCE UNIQUE À TENIR : toute évolution de `ROLE_PERMISSIONS` côté gateway doit
 * être répercutée ici à l'identique. Le serveur reste l'autorité (fail-safe) ; ceci
 * n'est qu'un reflet d'affichage.
 */

const ADMIN_PERMS = [
    'DOSIMETRY_READ_AGGREGATE', 'DOSIMETRY_READ_NOMINATIVE', 'DOSIMETRY_WRITE',
    'DOSIMETRY_MEDICAL', 'DOSIMETRY_PCR_RPO', 'DOSIMETRY_ADMIN', 'DOSIMETRY_EXPORT_MEDICAL',
    'BLAST_VIEW', 'BLAST_PLAN', 'BLAST_CONFIRM', 'BLAST_ALARM', 'BLAST_REPORT', 'BLAST_ADMIN',
    'INSPECTION_VIEW', 'INSPECTION_PLAN', 'INSPECTION_EXECUTE', 'INSPECTION_VALIDATE',
    'INSPECTION_TEMPLATE_MANAGE', 'INSPECTION_ADMIN',
    'INCIDENT_VALIDATE', 'INCIDENT_CLOSE', 'HS_POLICY_MANAGE',
];

const COORDINATOR_PERMS = [
    'DOSIMETRY_READ_AGGREGATE', 'DOSIMETRY_READ_NOMINATIVE', 'DOSIMETRY_WRITE', 'DOSIMETRY_PCR_RPO',
    'BLAST_VIEW', 'BLAST_PLAN', 'BLAST_CONFIRM', 'BLAST_REPORT',
    'INSPECTION_VIEW', 'INSPECTION_PLAN', 'INSPECTION_EXECUTE', 'INSPECTION_VALIDATE',
    'INSPECTION_TEMPLATE_MANAGE',
    'INCIDENT_VALIDATE', 'INCIDENT_CLOSE', 'HS_POLICY_MANAGE',
];

const INVESTIGATOR_PERMS = [
    'DOSIMETRY_READ_AGGREGATE', 'DOSIMETRY_READ_NOMINATIVE', 'INSPECTION_VIEW', 'BLAST_VIEW',
];

const AUDITOR_PERMS = [
    'INSPECTION_VIEW', 'INSPECTION_VALIDATE', 'DOSIMETRY_READ_AGGREGATE', 'BLAST_VIEW',
];

const EMPLOYEE_PERMS = ['INSPECTION_VIEW', 'BLAST_VIEW'];

const ROLE_AUTHORITIES: Record<string, string[]> = {
    SYSTEM_ADMINISTRATOR: ADMIN_PERMS,
    ADMINISTRATOR: ADMIN_PERMS,
    ADMIN: ADMIN_PERMS,
    HEALTH_SAFETY_COORDINATOR: COORDINATOR_PERMS,
    HSE_MANAGER: COORDINATOR_PERMS,
    HSE_OFFICER: COORDINATOR_PERMS,
    INCIDENT_INVESTIGATOR: INVESTIGATOR_PERMS,
    AUDITOR: AUDITOR_PERMS,
    EMPLOYEE: EMPLOYEE_PERMS,
};

/** Normalise un rôle libre (« Administrator », « HSE Manager ») vers la clé de la map. */
export function normalizeRole(role?: string | null): string {
    return (role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function authoritiesForRole(role?: string | null): string[] {
    return ROLE_AUTHORITIES[normalizeRole(role)] ?? [];
}

/** true si le rôle donné détient l'autorité HNS demandée (reflet du gateway). */
export function hasAuthority(role: string | null | undefined, authority: string): boolean {
    return authoritiesForRole(role).includes(authority);
}
