import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OTPBoxed from "../components/OTPBoxed";
import NotFoundPage from "../error_pages/404NotFound";

const CallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query parameters
  const searchParams = new URLSearchParams(location.search);
  const statusCode = searchParams.get("status_code");
  const userId = searchParams.get("user_id");

  // Perform actions based on status code
  React.useEffect(() => {
    if (statusCode === "200") {
      navigate("/"); // Redirect to home if status code is 200
    }
  }, [statusCode, navigate]);

  if (statusCode === "202") {
    return <OTPBoxed userId={Number(userId)} />;
  }

  return (
      <NotFoundPage />
  );
};

export default CallbackPage;
