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
            .then((res) => {
                dispatch(setUser(res));
            })
            .catch(() => {
                dispatch(setUser(null));
            })
            .finally(() => setLoading(false));
    }, [dispatch]);

    return { user, loading };
};