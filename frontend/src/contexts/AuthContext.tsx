import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, getStoredToken, setStoredToken } from "@/lib/api";

export type UserRole = "admin" | "staff" | "fundraising_director" | "donor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type LoginOutcome =
  | { status: "ok"; user: User }
  | { status: "mfa_required"; email: string; requiresTwoFactor: true };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  verifyTwoFactor: (email: string, code: string) => Promise<User>;
  googleLogin: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapApiRoleToUserRole(role: string): UserRole {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "staff") return "staff";
  if (r === "donor") return "donor";
  return "staff";
}

async function loadUserFromSession(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await authApi.me();
    if (!res.success || !res.data) {
      setStoredToken(null);
      return null;
    }
    const d = res.data;
    return {
      id: d.id,
      email: d.email,
      name: d.displayName || d.email,
      role: mapApiRoleToUserRole(d.role),
    };
  } catch {
    setStoredToken(null);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await loadUserFromSession();
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginOutcome> => {
    const res = await authApi.login(email.trim(), password);
    if (!res.success) {
      throw new Error(res.message || "Invalid email or password");
    }
    const d = res.data;
    if (d.requiresTwoFactor) {
      return { status: "mfa_required", email: d.email ?? email.trim(), requiresTwoFactor: true };
    }
    if (!d.token) {
      throw new Error(res.message || "Login failed");
    }
    setStoredToken(d.token);
    const u = await loadUserFromSession();
    if (!u) throw new Error("Could not load profile");
    setUser(u);
    return { status: "ok", user: u };
  }, []);

  const verifyTwoFactor = useCallback(async (email: string, code: string) => {
    const res = await authApi.verifyTwoFactor(email.trim(), code.trim());
    if (!res.success || !res.data?.token) {
      throw new Error(res.message || "Invalid verification code");
    }
    setStoredToken(res.data.token);
    const u = await loadUserFromSession();
    if (!u) throw new Error("Could not load profile");
    setUser(u);
    return u;
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authApi.googleLogin(idToken);
    if (!res.success || !res.data?.token) {
      throw new Error(res.message || "Google sign-in failed");
    }
    setStoredToken(res.data.token);
    const u = await loadUserFromSession();
    if (!u) throw new Error("Could not load profile");
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) await authApi.logout();
    } catch {
      /* ignore */
    }
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyTwoFactor,
        googleLogin,
        logout,
        isAuthenticated: !!user,
      }}
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
