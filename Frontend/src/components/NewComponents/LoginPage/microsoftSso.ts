/**
 * Configuration du fournisseur d'identité Microsoft (Entra ID / Azure AD).
 *
 * Le frontend ne connaît QUE le point de départ du parcours, exposé par le
 * backend : aucun client id, aucun secret, aucun jeton ne transite par le
 * bundle. Le callback et la pose de session restent côté serveur, comme pour
 * l'authentification par mot de passe.
 *
 * Variable d'environnement :
 *   VITE_MS_SSO_START_URL — URL absolue https du point d'entrée OIDC
 *                           (ex. `https://<gateway>/hrms/auth/oauth2/microsoft`).
 *
 * Absente ou invalide : le bouton reste visible mais inactif, et annoncé comme
 * indisponible — jamais de connexion simulée.
 */

/** N'accepte qu'une URL absolue https — une valeur douteuse désactive le SSO. */
function resolveStartUrl(raw: string): string | null {
    if (!raw) return null;
    try {
        const url = new URL(raw);
        return url.protocol === 'https:' ? url.toString() : null;
    } catch {
        return null;
    }
}

export const MICROSOFT_SSO_START_URL = resolveStartUrl(
    (import.meta.env.VITE_MS_SSO_START_URL ?? '').trim(),
);

export const isMicrosoftSsoConfigured = MICROSOFT_SSO_START_URL !== null;
