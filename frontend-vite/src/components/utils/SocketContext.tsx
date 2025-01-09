import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SocketContextType {
  socket: WebSocket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Function to establish a socket connection
  const connectSocket = () => {
    if (!socket) {
      const newSocket = new WebSocket("ws://localhost:8000/ws/online_status/");
      newSocket.onopen = () => {
        console.log("WebSocket connected");
      };
      newSocket.onclose = () => {
        console.log("WebSocket disconnected");
        setSocket(null);
      };
      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setSocket(newSocket);
    }
  };

  // Function to disconnect the socket
  const disconnectSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
        console.log("WebSocket cleanup on unmount");
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connectSocket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the SocketContext
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
