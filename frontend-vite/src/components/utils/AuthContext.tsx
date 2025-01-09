import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import axios from "./AxiosInstance";

interface AuthContextType {
  isAuthenticated: boolean;
  userId: number;
  login: (token: string) => void;
  logout: () => void;
  setUserId: (id: number) => void;
  isAuthChecked: boolean;
  isSocketReady: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<number>(-1);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("Checking authentication status...");
        const response = await axios.get("users/auth/verify/");
        if (response.status === 200) {
          console.log("Authentication verified");
          setIsAuthenticated(true);

          const userResponse = await axios.get("users/me/");
          if (userResponse.status === 200) {
            console.log("User details fetched:", userResponse.data);
            setUserId(userResponse.data.user_id);
          }
        }
      } catch (error) {
        console.warn("Authentication failed or user not authenticated");
        setIsAuthenticated(false);
        setUserId(-1);
      } finally {
        setIsAuthChecked(true);
        setIsSocketReady((prev) => {
			if (!prev && isAuthenticated) {
			  console.log("Socket is now ready");
			  return true;
			}
			return prev; // Maintain the current state if nothing changes
		  });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = (token: string) => {
    console.log("Login called, setting authentication state");
    setIsAuthenticated(true);
    setIsSocketReady(true); // Allow socket connection post-login
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await axios.delete("users/auth/logout/");
      if (response.status === 200) {
        console.log("Logout successful, resetting state");
        setIsAuthenticated(false);
        setUserId(-1);
        setIsSocketReady(false); // Disconnect the socket on logout
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        login,
        logout,
        setUserId,
        isAuthChecked,
        isSocketReady,
      }}
    >
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
