/**
 * MobileRedirectGuard — A monter UNE SEULE FOIS dans l'application web,
 * en racine. Si l'utilisateur arrive sur une page de la version web
 * standard alors qu'il navigue clairement depuis un mobile (UA + viewport
 * ou Capacitor), le composant le redirige vers /m/home.
 *
 * L'utilisateur peut forcer la version web en ajoutant ?desktop=1 a l'URL
 * ou en cliquant un lien dedie depuis le menu profil mobile (qui store
 * 'safex360-prefer-desktop' dans localStorage).
 *
 * Inversement, un utilisateur desktop qui visite directement /m/home reste
 * sur la version mobile (pas de redirect /m -> /).
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMobileDetection } from '../hooks/useMobileDetection';

const PUBLIC_PATHS = ['/login', '/forget-password', '/landing', '/reset-password'];

export default function MobileRedirectGuard() {
    const { shouldRedirectToMobile, ready } = useMobileDetection();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!ready) return;
        if (!shouldRedirectToMobile) return;
        const path = location.pathname;
        if (path.startsWith('/m/') || path === '/m') return;
        // La vitrine publique n'a pas d'equivalent /m : l'expulser vers
        // /m/home (ecran authentifie) interdisait a tout visiteur mobile de
        // simplement VOIR le site.
        if (path === '/') return;
        if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return;
        // Toute route desktop reste redirigée tant que le terminal est mobile.
        // Le choix explicite ?desktop=1 est le seul mécanisme de désactivation.
        navigate('/m/home', { replace: true });
    }, [ready, shouldRedirectToMobile, location.pathname, navigate]);

    return null;
}
