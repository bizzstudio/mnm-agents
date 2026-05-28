import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "@/api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [agent, setAgent] = useState(() => {
    try {
      const raw = localStorage.getItem("agentInfo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // ריענון פרופיל ברקע (מעדכן הרשאות, יעדים, סטטוס פעיל)
  const refresh = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setAgent(me);
      localStorage.setItem("agentInfo", JSON.stringify(me));
    } catch {
      // נכשל → לא חוסם, ה-401 interceptor יטפל בלוגאוט אם צריך
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("agentToken")) {
      refresh();
    }
  }, [refresh]);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const res = await authApi.loginAgent({ phone, password });
      localStorage.setItem("agentToken", res.token);
      localStorage.setItem("agentInfo", JSON.stringify(res.agent));
      setAgent(res.agent);
      return res.agent;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("agentToken");
    localStorage.removeItem("agentInfo");
    setAgent(null);
  };

  return (
    <AuthContext.Provider value={{ agent, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
