
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/LoginService";
import { useAppDispatch } from "../slices/hooks";
import { removeJwt } from "../slices/JwtSlice";
import { setUser } from "../slices/UserSlice";
import { setProfile } from "../slices/ProfileSlice";
import { resetCompanySelection, COMPANY_SELECTION_STORAGE_KEY } from "../slices/CompanySelectionSlice";
import { invalidateProfileCache } from "../routes/FirstLoginGuard";
import { clearReferenceCache } from "../utility/referenceCache";

const useLogout = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            // Purge complète de l'état de session : sans cela, un utilisateur B
            // se connectant après un utilisateur A sur le même navigateur
            // hériterait de sa photo de profil, de sa mine sélectionnée et de
            // son cache first-login.
            dispatch(removeJwt());
            dispatch(setUser(null));
            dispatch(setProfile({}));
            dispatch(resetCompanySelection());
            invalidateProfileCache();
            // Vide le cache des référentiels : les listes (employés, départements)
            // sont mine-scopées, elles ne doivent pas fuiter vers la session suivante.
            clearReferenceCache();
            try {
                localStorage.removeItem(COMPANY_SELECTION_STORAGE_KEY);
            } catch { /* stockage inaccessible — non bloquant */ }
            navigate("/login", { replace: true });
        }
    }, [dispatch, navigate]);

    return logout;
};

export default useLogout;
