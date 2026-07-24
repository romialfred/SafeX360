import { PageLoader } from "../components/UtilityComp/SandglassLoader";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
    children: JSX.Element;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <PageLoader minHeight="100vh" delay={150} />;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};
export default ProtectedRoute;