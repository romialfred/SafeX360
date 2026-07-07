// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../slices/hooks";
import { setUser } from "../slices/UserSlice";
import { getUser } from "../services/LoginService";

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUser()
            .then((res: any) => {
                // Un « 200 » n'est pas une preuve d'authentification : dans
                // l'APK, le serveur local Capacitor répond le index.html (SPA
                // fallback) avec 200 sur n'importe quel chemin. Seul un objet
                // portant une identité réelle vaut connexion — sinon l'app
                // s'ouvrait connectée avec un « Utilisateur » fantôme et la
                // déconnexion rebondissait indéfiniment vers l'accueil.
                const valid = res && typeof res === 'object' && !Array.isArray(res)
                    && (res.id != null || res.empId != null || res.login != null || res.sub != null);
                dispatch(setUser(valid ? res : null));
            })
            .catch(() => {
                dispatch(setUser(null));
            })
            .finally(() => setLoading(false));
    }, [dispatch]);

    return { user, loading };
};