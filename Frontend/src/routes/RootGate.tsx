import { Center, Loader } from '@mantine/core';
import { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LandingPage from '../components/NewComponents/LandingPage/LandingPage';
import { isNativePlatform } from '../m/utils/capacitorBridge';

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
        return <LandingPage />;
    }

    return children;
};

export default RootGate;
