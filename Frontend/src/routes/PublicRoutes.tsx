import { PageLoader } from "../components/UtilityComp/SandglassLoader";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PublicRoutesProps {
    children: JSX.Element;
}
const PublicRoutes: React.FC<PublicRoutesProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <PageLoader minHeight="100vh" delay={150} />;
    }

    if (user) {
        return <Navigate to="/" />;
    }

    return children;
};
export default PublicRoutes;