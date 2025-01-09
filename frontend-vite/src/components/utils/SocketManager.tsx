import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useEffect } from "react";

const SocketManager: React.FC = () => {
  const { isAuthenticated, isAuthChecked } = useAuth();
  const { connectSocket, disconnectSocket } = useSocket();

  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, isAuthChecked, connectSocket, disconnectSocket]);

  return null; // No UI is needed; this handles socket lifecycle.
};

export default SocketManager;
