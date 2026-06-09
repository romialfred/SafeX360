/**
 * FirstLoginGuard — Garde de route qui force le changement de mot de passe
 * lors de la premiere connexion.
 *
 * Logique :
 *  1. Si la route est /login ou /first-login => laisser passer (pas de check)
 *  2. Sinon, charge /hrms/me/profile :
 *     - 401 / pas connecte => redirect /login
 *     - firstLogin === true => redirect /first-login
 *     - sinon => laisser passer
 *
 * Cache le profil en memoire pour eviter de rappeler /profile a chaque navigation.
 * Le cache est invalide a logout ou apres /change-password-first reussi.
 */

import { useEffect, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Loader, Text } from '@mantine/core';
import { getMyProfile, MyProfile } from '../services/UserManagementService';

// Cache module-level pour eviter les appels repetes
let cachedProfile: MyProfile | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

/** Routes qui ne necessitent PAS de check first-login (login, page de change MDP elle-meme). */
const BYPASS_ROUTES = ['/login', '/first-login', '/forgot-password', '/reset-password'];

/** Public — invalide le cache (a appeler apres logout ou change MDP reussi). */
export const invalidateProfileCache = () => {
    cachedProfile = null;
    cacheLoadedAt = 0;
};

/** Public — retourne le profil en cache si dispo, sinon null. */
export const getCachedProfile = (): MyProfile | null => cachedProfile;

interface Props {
    children: ReactNode;
}

export default function FirstLoginGuard({ children }: Props) {
    const location = useLocation();
    const [state, setState] = useState<'loading' | 'ok' | 'redirect-login' | 'redirect-first-login'>('loading');

    // Routes bypass : ne checke rien
    const isBypass = BYPASS_ROUTES.some((r) => location.pathname.startsWith(r));

    useEffect(() => {
        if (isBypass) {
            setState('ok');
            return;
        }

        // Cache TTL
        const now = Date.now();
        if (cachedProfile && now - cacheLoadedAt < CACHE_TTL_MS) {
            if (cachedProfile.firstLogin) {
                setState('redirect-first-login');
            } else {
                setState('ok');
            }
            return;
        }

        // Charge le profil
        getMyProfile()
            .then((profile) => {
                cachedProfile = profile;
                cacheLoadedAt = Date.now();
                if (profile.firstLogin) {
                    setState('redirect-first-login');
                } else {
                    setState('ok');
                }
            })
            .catch((err: any) => {
                if (err?.response?.status === 401) {
                    setState('redirect-login');
                } else {
                    // En cas d'erreur reseau / 500, on laisse passer pour ne pas bloquer
                    // l'utilisateur (degradation gracieuse).
                    console.warn('[FirstLoginGuard] profile load failed:', err?.message);
                    setState('ok');
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    if (state === 'loading') {
        return (
            <Box
                style={{
                    minHeight: '100vh',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 16, background: '#F9FAFB',
                }}
            >
                <Loader color="teal" size="md" />
                <Text size="sm" c="dimmed">Verification de la session…</Text>
            </Box>
        );
    }

    if (state === 'redirect-login') {
        return <Navigate to="/login" replace />;
    }

    if (state === 'redirect-first-login') {
        return <Navigate to="/first-login" replace />;
    }

    return <>{children}</>;
}
