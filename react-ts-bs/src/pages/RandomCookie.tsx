import React, { useState, useEffect } from "react";
import axiosInstance from "../components/AxiosInstance"; // Your Axios instance with `withCredentials`

const CookieTest: React.FC = () => {
  const [cookieValue, setCookieValue] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const fetchCookie = async () => {
    try {
      // Make a GET request to /cookie_test/
      const response = await axiosInstance.get("users/random_cookie/");
      console.log("Response from /cookie_test/:", response);

      // Try to get the cookie from the browser
      const randomCookie = getCookie("test_cookie");
      if (randomCookie) {
        setCookieValue(randomCookie);
      } else {
        setErrorMessage("Cookie 'test_cookie' not found in document.cookie");
      }
    } catch (error) {
      console.error("Error fetching cookie:", error);
      setErrorMessage("Failed to fetch cookie");
    }
  };

  useEffect(() => {
    fetchCookie();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        color: "#343a40",
        fontSize: "1.5rem",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      <h1>Cookie Test</h1>
      {/* {cookieValue ? (
        <p>
          <strong>Cookie Value:</strong> {cookieValue}
        </p>
      ) : (
        <p>
          <strong>Error:</strong> {errorMessage}
        </p>
      )} */}
    </div>
  );
};

export default CookieTest;
