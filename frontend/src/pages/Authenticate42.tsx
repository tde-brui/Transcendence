import React, { useEffect, useState } from "react";
import "../css/Utils.css";
import axiosInstance from "../components/utils/AxiosInstance";

const Authenticate42: React.FC = () => {
  const handleAuthentication = () => {
    // Redirect the browser to the backend endpoint
    window.location.href = "/api/users/42_login/";
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card profile-card mx-auto">
        <div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">
            Account not authenticated
          </h4>
        </div>
        <div className="card-body profile-body text-center">
          <p className="mb-4">
            Your account has not been authenticated. Please authenticate your
            account using your 42 account.
          </p>
          <button onClick={handleAuthentication} className="btn btn-primary">
            Authenticate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Authenticate42;
