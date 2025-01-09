import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./components/utils/AuthContext"; // Import AuthProvider (adjust path as necessary)
import { SocketProvider } from "./components/utils/SocketContext";
import SocketManager from "./components/utils/SocketManager";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
		<SocketManager />
        <App />
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
