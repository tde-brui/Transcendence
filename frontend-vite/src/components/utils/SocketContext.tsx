import React, { createContext, useEffect, useState, useContext, ReactNode } from "react";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
  socketUrl: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, socketUrl }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectSocket = () => {
      console.log("Connecting WebSocket...");
      const ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setSocket(ws);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        console.log("Message received:", event.data);
        // Handle any incoming messages from the server here
      };

      ws.onclose = () => {
        console.warn("WebSocket closed");
        setIsConnected(false);
        setSocket(null);

        // Attempt to reconnect after a delay
        setTimeout(() => connectSocket(), 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close(); // Close on error
      };
    };

    // Establish the WebSocket connection when the provider mounts
    connectSocket();

    // Clean up the WebSocket connection when the provider unmounts
    return () => {
      console.log("Cleaning up WebSocket connection...");
      if (socket) socket.close();
    };
  }, [socketUrl]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to access the WebSocket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
