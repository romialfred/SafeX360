import { Navigate, useLocation } from 'react-router-dom';

/**
 * Redirige l'ancienne URL publique vers la vitrine SafeX canonique.
 *
 * La query string et le fragment sont conserves pour ne pas casser les liens
 * de campagne ou les ancres existantes. `replace` evite de laisser la route
 * obsolete dans l'historique de navigation.
 */
export default function CanonicalLandingRedirect() {
    const { search, hash } = useLocation();

    return (
        <Navigate
            to={{ pathname: '/', search, hash }}
            replace
        />
    );
}
