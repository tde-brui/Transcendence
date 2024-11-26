import React, { useState, useEffect } from "react";
import axiosInstance from "../components/AxiosInstance"; // Ensure this is your Axios instance with `withCredentials`

const TestCookie: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<"ok" | "error" | null>(null);

  const checkAuthStatus = async () => {
    try {
      const response = await axiosInstance.get("/users/auth/verify/"); // Backend endpoint to verify authentication
	//   console.log("response:", response);
      if (response.status === 200) {
        setAuthStatus("ok");
      } else {
        setAuthStatus("error");
      }
    } catch (error) {
      console.error("Authentication status check failed:", error);
      setAuthStatus("error");
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: authStatus === "ok" ? "green" : "red",
        color: "white",
        fontSize: "4rem",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {authStatus === "ok" && "OK"}
      {authStatus === "error" && "ERROR"}
      {authStatus === null && "Checking..."}
    </div>
  );
};

export default TestCookie;
