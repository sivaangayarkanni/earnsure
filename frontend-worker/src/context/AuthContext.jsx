import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "earnsure_worker_role";

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem(STORAGE_KEY));

  const login = (nextRole) => {
    localStorage.setItem(STORAGE_KEY, nextRole);
    setRole(nextRole);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRole(null);
  };

  const value = useMemo(
    () => ({ role, login, logout, isAuthenticated: role === "worker" }),
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
