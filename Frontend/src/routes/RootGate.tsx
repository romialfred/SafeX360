import { Center, Loader } from '@mantine/core';
import { JSX } from 'react';
import { useAuth } from '../hooks/useAuth';
import LandingPage from '../components/NewComponents/LandingPage/LandingPage';

/**
 * RootGate — Gate pour la route racine '/'.
 *
 * Comportement :
 *   - loading : affiche un loader centre
 *   - user authentifie : affiche les enfants (DashboardLayout)
 *   - user non authentifie : affiche la LandingPage (vitrine commerciale)
 *
 * Ce composant remplace ProtectedRoute uniquement pour '/' afin que les
 * visiteurs non connectes voient la vitrine plutot qu'une redirection
 * automatique vers /login. Toutes les autres routes app restent protegees.
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
        return <LandingPage />;
    }

    return children;
};

export default RootGate;
