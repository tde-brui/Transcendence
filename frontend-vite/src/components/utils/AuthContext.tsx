import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	ReactNode,
  } from "react";
  import axios from "./AxiosInstance";
  
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
  
  let socket: WebSocket | null = null; // WebSocket instance
  
  // Provider component
  export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [userId, setUserId] = useState<number>(-1);
	const [isAuthChecked, setIsAuthChecked] = useState(false);
  
	// Function to establish WebSocket connection
	const connectWebSocket = () => {
	  if (socket || !isAuthenticated) return; // Avoid reconnecting if already connected
  
	  const wsUrl = "ws://localhost:8000/ws/online_status/"; // Use wss:// for production
	  socket = new WebSocket(wsUrl);
  
	  socket.onopen = () => {
		console.log("WebSocket connection established");
	  };
  
	  socket.onmessage = (event) => {
		console.log("Message received:", event.data);
	  };
  
	  socket.onclose = (event) => {
		console.log("WebSocket connection closed:", event.reason || "No reason provided");
		socket = null;
	  };
  
	  socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	  };
	};
  
	// Function to close WebSocket connection
	const disconnectWebSocket = () => {
	  if (socket) {
		socket.close();
		socket = null;
		console.log("WebSocket connection closed manually");
	  }
	};
  
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
		  setIsAuthenticated(false);
		  setUserId(-1);
		} finally {
		  setIsAuthChecked(true); // Mark auth check as complete
		}
	  };
  
	  checkAuthStatus();
	}, []);
  
	// Manage WebSocket connection on authentication state change
	useEffect(() => {
	  if (isAuthenticated) {
		connectWebSocket();
	  } else {
		disconnectWebSocket();
	  }
  
	  // Cleanup on component unmount
	  return () => disconnectWebSocket();
	}, [isAuthenticated]);
  
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
	  <AuthContext.Provider
		value={{
		  isAuthenticated,
		  userId,
		  login,
		  logout,
		  setUserId,
		  isAuthChecked,
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
  