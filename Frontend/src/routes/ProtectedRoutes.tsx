import { PageLoader } from "../components/UtilityComp/SandglassLoader";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
    children: JSX.Element;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <PageLoader minHeight="100vh" delay={150} />;
    }

    if (!user) {
        // La destination demandée est transmise à la page de connexion pour y
        // revenir après authentification. Elle y est assainie (chemin interne
        // uniquement) avant toute redirection — voir `safeRedirect.ts`.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
};
export default ProtectedRoute;