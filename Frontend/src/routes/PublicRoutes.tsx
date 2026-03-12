import { Center, Loader } from "@mantine/core";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PublicRoutesProps {
    children: JSX.Element;
}
const PublicRoutes: React.FC<PublicRoutesProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Center h="100vh">
                <Loader />
            </Center>
        );
    }

    if (user) {
        return <Navigate to="/" />;
    }

    return children;
};
export default PublicRoutes;