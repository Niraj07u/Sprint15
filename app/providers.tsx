"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUser, type AuthResponse, type AuthUser } from "@/lib/api-client";
import { ToastProvider, useToast } from "@/components/toast/toast-context";
import { ToastContainer } from "@/components/toast/toast-container";

export { useToast };

const TOKEN_KEY = "prodesk_auth_token";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  establishSession: (response: AuthResponse) => void;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const restoreSession = async () => {
      if (!token) return;
      try {
        const { user: restoredUser } = await getCurrentUser(token);
        setUser(restoredUser);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    };

    restoreSession().finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      establishSession(response) {
        window.localStorage.setItem(TOKEN_KEY, response.token);
        setUser(response.user);
        setError(null);
      },
      logout,
      clearError() {
        setError(null);
      },
    }),
    [error, isLoading, logout, user],
  );

  return (
    <AuthContext.Provider value={value}>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within Providers.");
  return context;
}
