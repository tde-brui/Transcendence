import React, { createContext, useState, useEffect, useContext, ReactNode} from "react";
import axios from './AxiosInstance';

// Define AuthContext types
interface AuthContextType {
  isAuthenticated: boolean;
  userId: number;
  login: (token: string) => void;
  logout: () => void;
  setUserId: (id: number) => void;
}

interface AuthProviderProps {
	children: ReactNode; // Allow any valid React children
  }

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get("users/auth/verify/"); 
        if (response.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("User not authenticated:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = (token: string) => {
    setIsAuthenticated(true);
    // The server should handle setting cookies during login
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post("/auth/logout/");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const [userId, setUserId] = useState<number>(-1);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout, setUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
