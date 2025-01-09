import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const SocketManager: React.FC = () => {
  const { isSocketReady } = useAuth();
  const { connectSocket, disconnectSocket } = useSocket();

  useEffect(() => {
    if (isSocketReady) {
      console.log("Connecting WebSocket...");
      connectSocket();
    } else {
      console.log("Disconnecting WebSocket...");
      disconnectSocket();
    }
  }, [isSocketReady, connectSocket, disconnectSocket]);

  return null;
};

export default SocketManager;
