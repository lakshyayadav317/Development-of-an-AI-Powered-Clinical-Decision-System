import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import * as authClient from "../api/authClient.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) => (role === "doctor" ? "/doctor" : "/patient");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get("/api/me");
      setUser(data.user);
      setProfile(data.profile);
      return data.user;
    } catch {
      setUser(null);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      await authClient.signIn(email, password);
      const u = await refresh();
      if (!u) throw new Error("Signed in, but the session could not be read. Check the server logs.");
      return u;
    },
    [refresh]
  );

  const register = useCallback((payload) => api.post("/api/register", payload), []);

  const logout = useCallback(async () => {
    await authClient.signOut().catch(() => {});
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({ user, profile, loading, login, register, logout, refresh }), [user, profile, loading, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
