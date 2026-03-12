
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/LoginService";
import { useAppDispatch } from "../slices/hooks";
import { removeJwt } from "../slices/JwtSlice";
import { setUser } from "../slices/UserSlice";

const useLogout = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            dispatch(removeJwt());
            dispatch(setUser(null));
            navigate("/login", { replace: true });
        }
    }, [dispatch, navigate]);

    return logout;
};

export default useLogout;
