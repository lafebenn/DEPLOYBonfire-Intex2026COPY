import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "staff" | "fundraising_director";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, User & { password: string }> = {
  "admin@bonfire.org": { id: "1", name: "Sarah Mitchell", email: "admin@bonfire.org", role: "admin", password: "admin123" },
  "staff@bonfire.org": { id: "2", name: "James Rivera", email: "staff@bonfire.org", role: "staff", password: "staff123" },
  "director@bonfire.org": { id: "3", name: "Maria Chen", email: "director@bonfire.org", role: "fundraising_director", password: "director123" },
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

  const login = async (email: string, password: string) => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) {
      throw new Error("Invalid email or password");
    }
    const { password: _, ...userData } = mockUser;
    setUser(userData);
    localStorage.setItem("bonfire_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bonfire_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
