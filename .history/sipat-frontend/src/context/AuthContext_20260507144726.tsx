import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react";

// Define the shape of our User object
export interface User {
  email: string;
  role: "citizen" | "agency" | "admin";
  name: string;
  id?: number; // Usually good to keep track of the DB ID too!
}

interface AuthContextType {
  user: User | null;
  role: "citizen" | "agency" | "admin" | null; // Extracted for easy role-checking in App.tsx
  isLoggedIn: boolean;
  login: (userData: User) => void; // 🚀 Now accepts the full user object
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("sipat_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("sipat_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sipat_user");
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null, 
      isLoggedIn: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};