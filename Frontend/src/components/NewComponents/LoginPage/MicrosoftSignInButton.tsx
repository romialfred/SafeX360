import { useState } from 'react';
import { Loader } from '@mantine/core';
import type { LoginCopy } from './loginCopy';
import { MICROSOFT_SSO_START_URL, isMicrosoftSsoConfigured } from './microsoftSso';

/**
 * Bouton « Continuer avec Microsoft ».
 *
 * Aucune authentification n'est simulée : le bouton délègue au fournisseur
 * d'identité configuré côté serveur. Le point d'entrée est fourni par
 * l'environnement (`VITE_MS_SSO_START_URL`), jamais un secret client — le
 * client_id, le secret et le callback restent côté fournisseur / backend.
 *
 * Tant que la variable n'est pas renseignée, le bouton reste visible mais
 * inactif et explicitement annoncé comme indisponible (aucun clic mort, aucune
 * promesse que le produit ne tient pas).
 *
 * Variables d'environnement attendues (frontend) :
 *   VITE_MS_SSO_START_URL — URL absolue https du point de départ OIDC exposé par
 *                           le backend (ex. `https://…/hrms/auth/oauth2/microsoft`).
 * Côté backend (jamais dans le bundle) : tenant Entra ID, client id, client
 * secret et URI de redirection enregistrée.
 */

type Props = {
    t: LoginCopy;
    /** Destination interne à restituer après le retour du fournisseur. */
    redirectTo: string;
    /** Vrai pendant une soumission classique : on neutralise le second parcours. */
    disabled?: boolean;
};

const MicrosoftLogo = () => (
    <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true" focusable="false" className="shrink-0">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
        <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
);

export default function MicrosoftSignInButton({ t, redirectTo, disabled = false }: Props) {
    const [redirecting, setRedirecting] = useState(false);
    const configured = isMicrosoftSsoConfigured;
    const inactive = !configured || disabled || redirecting;

    const start = () => {
        if (!MICROSOFT_SSO_START_URL || inactive) return;
        setRedirecting(true);
        const target = new URL(MICROSOFT_SSO_START_URL);
        // La destination est un chemin interne déjà assaini par `sanitizeRedirect`.
        target.searchParams.set('next', redirectTo);
        window.location.assign(target.toString());
    };

    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={start}
                disabled={inactive}
                aria-disabled={inactive}
                // Le motif d'indisponibilité n'encombre plus l'écran : il reste
                // porté par le nom accessible et l'infobulle du bouton.
                aria-label={configured ? undefined : `${t.microsoftButton} — ${t.microsoftUnavailable}`}
                title={configured ? undefined : t.microsoftUnavailable}
                className="sx-ms-btn flex h-[56px] w-full items-center justify-center gap-3 rounded-[10px] border text-[15px] font-medium transition-colors"
                style={{
                    background: '#FFFFFF',
                    borderColor: '#DCE5E6',
                    color: '#0B2A38',
                    cursor: inactive ? 'not-allowed' : 'pointer',
                    opacity: configured ? 1 : 0.65,
                }}
            >
                {redirecting ? <Loader size="xs" color="#0E9E93" /> : <MicrosoftLogo />}
                <span>{redirecting ? t.microsoftProgress : t.microsoftButton}</span>
            </button>
        </div>
    );
}
