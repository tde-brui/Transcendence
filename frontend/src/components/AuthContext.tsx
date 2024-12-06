import React, { createContext, useState, useEffect, useContext, ReactNode} from "react";
import axios from './AxiosInstance';

// Define AuthContext types
interface AuthContextType {
  isAuthenticated: boolean;
  userId: number;
  login: (token: string) => void;
  logout: () => void;
  setUserId: (id: number) => void;
  isAuthChecked: boolean;
}

interface AuthProviderProps {
	children: ReactNode; // Allow any valid React children
  }

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const [userId, setUserId] = useState<number>(-1);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get("users/auth/verify/");
        if (response.status === 200) {
          setIsAuthenticated(true);
  
          const userResponse = await axios.get("users/me/");
          if (userResponse.status === 200) {
            console.info("User authenticated:", userResponse);
            console.info("Setting user ID to:", userResponse.data.user_id);
            setUserId(userResponse.data.user_id);
          }
        }
      } catch (error) {
        // console.error("User not authenticated:", error);
        setIsAuthenticated(false);
        setUserId(-1);
      } finally {
        setIsAuthChecked(true); // Mark auth check as complete
      }
    };

    checkAuthStatus();
  }, []);


  // Login function
  const login = (token: string) => {
    setIsAuthenticated(true);
    console.info("Login successful and token set:", token);
    // The server should handle setting cookies during login
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await axios.delete("users/auth/logout/");
      if (response.status === 200) {
        setIsAuthenticated(false);
        setUserId(-1);
      }
	  console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

 

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout, setUserId, isAuthChecked }}>
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
