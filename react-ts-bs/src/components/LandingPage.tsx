// In Home.tsx

import React from 'react';
import './css/Utils.css'

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <h1 className="text-white fst-italic playfair-text mb-4">WELCOME TO PONG</h1>
      <div className="d-flex align-items-center">
      <button type="button" className="btn btn-primary glass-button me-4" onClick={onLogin}>
        Login
      </button>
      <button type="button" className="btn btn-primary glass-button">
        Login with <img src="/42.png" alt="42 Logo" className="ms-2 logo-42" />
      </button>
      </div>
    </div>
  );
};

export default LandingPage;


