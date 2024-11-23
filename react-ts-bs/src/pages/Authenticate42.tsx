import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Utils.css';

const Authenticate42: React.FC = () => {

const redirectUrl = process.env.REACT_APP_REDIRECT_URL;
// console.log(redirectUrl);
// if (!redirectUrl) {
//     console.error("Redirect URL not set");
// }
  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card profile-card mx-auto">
        <div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">Account not authenticated</h4>
        </div>
        <div className="card-body profile-body text-center">
          <p className="mb-4">Your account has not been authenticated. Please authenticate your account using your 42 account. </p>
          <a href={redirectUrl} className="btn btn-primary">
            Authenticate
          </a>
        </div>
      </div>
    </div>
  );
};

export default Authenticate42;
