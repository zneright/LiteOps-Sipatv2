import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react";

// Define the shape of our User object
interface User {
  email: string;
  role: "citizen" | "agency" | "admin";
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, role: "citizen" | "agency" | "admin") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check if user was already logged in on page refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("sipat_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, role: "citizen" | "agency" | "admin") => {
    // Generate a display name based on role for the UI
    const name =
      role === "citizen"
        ? "Juan Dela Cruz"
        : role === "agency"
          ? "Agency Lead"
          : "Super Admin";
    const userData: User = { email, role, name };

    setUser(userData);
    localStorage.setItem("sipat_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sipat_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
