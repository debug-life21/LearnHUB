import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const refreshUser = useCallback(async () => {
        try {
            const response = await apiRequest("/api/auth/me");
            setUser(response.user);
        }
        catch {
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    }, []);
    async function logout() {
        await apiRequest("/api/auth/logout", {
            method: "POST",
        });
        setUser(null);
    }
    useEffect(() => {
        void refreshUser();
    }, [refreshUser]);
    const value = useMemo(() => ({
        user,
        loading,
        refreshUser,
        logout,
    }), [loading, refreshUser, user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }
    return context;
}
