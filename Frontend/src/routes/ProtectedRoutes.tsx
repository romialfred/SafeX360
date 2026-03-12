import { Center, Loader } from "@mantine/core";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
    children: JSX.Element;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Center h="100vh">
                <Loader />
            </Center>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;

    // // if (loading || !permissions) {
    // //     return (
    // //         <Center h="100vh">
    // //             <Loader />
    // //         </Center>
    // //     );
    // // }

    // // const isAllowed = permissions?.[permission][op] === "1";

    // // if (!isAllowed) {
    // //     errorNotification("You don't have access to this feature.", "");
    //     return <Navigate to="/unauthorized" />;
    // }

    // return children;
};
export default ProtectedRoute;