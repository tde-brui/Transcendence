// In Home.tsx

import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <h1 className="text-white fst-italic playfair-text mb-4">WELCOME TO PONG</h1>
      <button type="button" className="btn btn-primary glass-button" onClick={onLogin}>
        Login
      </button>
    </div>
  );
};

export default LandingPage;


