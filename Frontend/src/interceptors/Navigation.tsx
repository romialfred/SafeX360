/**
 * Redirection vers la connexion lors d'une session réellement expirée.
 *
 * LOT 53 (fix boucle) : on cible explicitement « /login » (et non « / »).
 * Auparavant navigate("/") renvoyait vers RootGate qui re-sondait /auth/me,
 * et un 401 relançait navigate("/") → boucle infinie (spinner sans fin).
 * On évite aussi de re-naviguer si l'on est déjà sur la page de connexion.
 */
import { setUser } from '../slices/UserSlice';

const navigateToLogin = async (navigate: any, dispatch: any) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
        return;
    }
    // Purger l'utilisateur du store AVANT de naviguer : sinon PublicRoutes
    // voit un user résiduel truthy et peut renvoyer vers « / » en boucle.
    try {
        dispatch?.(setUser(null));
    } catch { /* dispatch indisponible — la navigation reste prioritaire */ }
    // Un 401 applicatif signifie que la session ne protege plus les donnees
    // locales. Les queues offline restent preservees par defaut.
    const { purgeLocalSecurityState } = await import('../security/purgeLocalSecurityState');
    await purgeLocalSecurityState();
    navigate('/login');
};

export default navigateToLogin;
