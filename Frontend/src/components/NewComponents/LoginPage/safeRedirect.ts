/**
 * Destination post-connexion — prévention des redirections ouvertes.
 *
 * La destination demandée avant l'interception par `ProtectedRoute` est
 * restituée après authentification. Elle vient de l'historique (state) ou d'un
 * paramètre d'URL : dans les deux cas c'est une valeur contrôlable par un tiers,
 * donc jamais utilisée telle quelle.
 *
 * Seul un chemin INTERNE est accepté : il doit commencer par un unique « / »
 * (ni `//evil.com`, ni `/\evil.com`, ni `https://…`, ni `javascript:`), et ne
 * doit pas renvoyer sur les écrans d'authentification (boucle de connexion).
 */

const BLOCKED_PREFIXES = ['/login', '/forget-password', '/first-login'];

export const DEFAULT_REDIRECT = '/';

export function sanitizeRedirect(raw: unknown, fallback: string = DEFAULT_REDIRECT): string {
    if (typeof raw !== 'string') return fallback;

    const value = raw.trim();
    if (value.length === 0 || value.length > 512) return fallback;

    // Chemin relatif à la racine uniquement : un second séparateur en tête
    // (« // » ou « /\ ») est interprété par le navigateur comme une URL
    // protocol-relative vers un autre domaine.
    if (!value.startsWith('/')) return fallback;
    if (value.startsWith('//') || value.startsWith('/\\')) return fallback;

    // Caractères de contrôle / retours ligne : vecteur d'injection d'en-tête.
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;

    const pathname = value.split(/[?#]/)[0].toLowerCase();
    if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return fallback;
    }

    return value;
}

/**
 * Destination retenue : d'abord l'état de navigation posé par `ProtectedRoute`,
 * sinon le paramètre `?next=` de l'URL courante, sinon la racine.
 */
export function resolveRedirect(
    locationState: unknown,
    search: string,
    fallback: string = DEFAULT_REDIRECT,
): string {
    const fromState = (locationState as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (fromState?.pathname) {
        const candidate = `${fromState.pathname}${fromState.search ?? ''}`;
        const safe = sanitizeRedirect(candidate, '');
        if (safe) return safe;
    }

    try {
        const next = new URLSearchParams(search).get('next');
        const safe = sanitizeRedirect(next, '');
        if (safe) return safe;
    } catch {
        /* URLSearchParams ne jette pas en pratique — garde défensive. */
    }

    return fallback;
}
