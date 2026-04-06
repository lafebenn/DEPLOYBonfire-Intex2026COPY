import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "staff" | "fundraising_director" | "donor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type LoginOutcome =
  | { status: "ok"; user: User }
  | { status: "mfa_required"; email: string };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type MockUser = User & { password: string; mfaEnabled: boolean };

// Demo accounts — align with INTEX grading (admin no MFA, donor no MFA + history, MFA account)
const MOCK_USERS: Record<string, MockUser> = {
  "admin@bonfire.org": {
    id: "1",
    name: "Sarah Mitchell",
    email: "admin@bonfire.org",
    role: "admin",
    password: "admin123",
    mfaEnabled: false,
  },
  "staff@bonfire.org": {
    id: "2",
    name: "James Rivera",
    email: "staff@bonfire.org",
    role: "staff",
    password: "staff123",
    mfaEnabled: false,
  },
  "director@bonfire.org": {
    id: "3",
    name: "Maria Chen",
    email: "director@bonfire.org",
    role: "fundraising_director",
    password: "director123",
    mfaEnabled: false,
  },
  "donor@bonfire.org": {
    id: "4",
    name: "David Reyes",
    email: "donor@bonfire.org",
    role: "donor",
    password: "donor123",
    mfaEnabled: false,
  },
  /** MFA-enabled (graders verify MFA is required; cannot complete in demo) */
  "mfa@bonfire.org": {
    id: "5",
    name: "MFA Demo User",
    email: "mfa@bonfire.org",
    role: "donor",
    password: "mfa123",
    mfaEnabled: true,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bonfire_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("bonfire_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<LoginOutcome> => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) {
      throw new Error("Invalid email or password");
    }
    if (mockUser.mfaEnabled) {
      return { status: "mfa_required", email: mockUser.email };
    }
    const { password: _p, mfaEnabled: _m, ...userData } = mockUser;
    setUser(userData);
    localStorage.setItem("bonfire_user", JSON.stringify(userData));
    return { status: "ok", user: userData };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bonfire_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isAuthenticated: !!user }}
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
