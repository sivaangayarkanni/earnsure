import { createContext, useContext, useMemo, useState } from "react";
import { clearTokens, logout as apiLogout, setTokens } from "../api/client.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "earnsure_role";

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    const savedRole = localStorage.getItem(STORAGE_KEY);
    const accessToken = localStorage.getItem("earnsure_access_token");
    if (!accessToken) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return savedRole;
  });

  const login = ({ role: nextRole, access_token, refresh_token }) => {
    localStorage.setItem(STORAGE_KEY, nextRole);
    setTokens({ access_token, refresh_token });
    setRole(nextRole);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      clearTokens();
    }
    localStorage.removeItem(STORAGE_KEY);
    setRole(null);
  };

  const value = useMemo(
    () => ({
      role,
      login,
      logout,
      isWorker: role === "worker",
      isAdmin: role === "admin",
      isAuthenticated: Boolean(role),
    }),
    [role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
