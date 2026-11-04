import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, type ApiUser } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleAuthRefreshed(event: Event) {
      const apiUser = (event as CustomEvent<ApiUser>).detail;
      if (apiUser) setUser(apiUser);
    }

    function handleAuthCleared() {
      setUser(null);
    }

    window.addEventListener("kuralearn-auth-refreshed", handleAuthRefreshed);
    window.addEventListener("kuralearn-auth-cleared", handleAuthCleared);
    return () => {
      window.removeEventListener("kuralearn-auth-refreshed", handleAuthRefreshed);
      window.removeEventListener("kuralearn-auth-cleared", handleAuthCleared);
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("kuralearn_user");
    const token = localStorage.getItem("kuralearn_token");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("kuralearn_user");
        localStorage.removeItem("kuralearn_token");
        localStorage.removeItem("kuralearn_refresh_token");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      authApi
        .me()
        .then(({ user: apiUser }) => {
          localStorage.setItem("kuralearn_user", JSON.stringify(apiUser));
          setUser(apiUser);
        })
        .catch(() => {
          // Token may be expired, clear session once to prevent infinite refresh loop
          localStorage.removeItem("kuralearn_user");
          localStorage.removeItem("kuralearn_token");
          localStorage.removeItem("kuralearn_refresh_token");
          setUser(null);
        });
      return;
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    try {
      const result = await authApi.login(email, password);
      localStorage.setItem("kuralearn_user", JSON.stringify(result.user));
      localStorage.setItem("kuralearn_token", result.accessToken);
      localStorage.setItem("kuralearn_refresh_token", result.refreshToken);
      setUser(result.user);
      return;
    } catch (error) {
      throw error;
    }
  }

  async function register(input: { name: string; email: string; password: string; role: string }) {
    const result = await authApi.register(input);
    localStorage.setItem("kuralearn_user", JSON.stringify(result.user));
    localStorage.setItem("kuralearn_token", result.accessToken);
    localStorage.setItem("kuralearn_refresh_token", result.refreshToken);
    setUser(result.user);
  }

  function logout() {
    authApi.logout().catch(() => undefined);
    localStorage.removeItem("kuralearn_user");
    localStorage.removeItem("kuralearn_token");
    localStorage.removeItem("kuralearn_refresh_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
