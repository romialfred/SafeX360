import { Center, Loader } from '@mantine/core';
import { JSX, lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isNativePlatform } from '../m/utils/capacitorBridge';
import { PageLoader } from '../components/UtilityComp/SandglassLoader';

// VITRINE CHARGEE A LA DEMANDE : elle ne concerne que les visiteurs anonymes,
// mais son import direct la placait dans le chunk d'entree — chaque utilisateur
// connecte telechargeait une page qu'il ne verra jamais.
const LandingPage = lazy(() => import('../components/NewComponents/LandingPage/LandingPage'));

/**
 * RootGate — Gate pour la route racine '/'.
 *
 * Comportement :
 *   - loading : affiche un loader centre
 *   - user authentifie : affiche les enfants (DashboardLayout)
 *   - user non authentifie :
 *       - APK Capacitor : redirige vers /login (pas de vitrine)
 *       - Web : affiche la LandingPage (vitrine commerciale)
 */
interface RootGateProps {
    children: JSX.Element;
}

const RootGate: React.FC<RootGateProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Center h="100vh">
                <Loader />
            </Center>
        );
    }

    if (!user) {
        if (isNativePlatform()) {
            return <Navigate to="/login" replace />;
        }
        return (
            <Suspense fallback={<PageLoader label="Chargement…" minHeight="100vh" />}>
                <LandingPage />
            </Suspense>
        );
    }

    return children;
};

export default RootGate;
