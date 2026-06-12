/**
 * Redirection vers la connexion lors d'une session réellement expirée.
 *
 * LOT 53 (fix boucle) : on cible explicitement « /login » (et non « / »).
 * Auparavant navigate("/") renvoyait vers RootGate qui re-sondait /auth/me,
 * et un 401 relançait navigate("/") → boucle infinie (spinner sans fin).
 * On évite aussi de re-naviguer si l'on est déjà sur la page de connexion.
 */
const navigateToLogin = (navigate: any, _dispatch: any) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
        return;
    }
    navigate('/login');
};

export default navigateToLogin;
