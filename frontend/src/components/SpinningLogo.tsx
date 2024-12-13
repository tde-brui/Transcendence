import React from 'react';
import '../css/SpinningLogo.css';
import '../css/UserProfile.css';

const SpinningLogo: React.FC = () => {
    return (
        <div className="container d-flex flex-column align-items-center justify-content-center">
      <div className="card profile-card mx-auto"> 
	  	<div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">Loading... </h4>
        </div>
		<div className="card-body profile-body">
            <div className="spinner"></div>
        </div>
        </div>
        </div>
    );
};

export default SpinningLogo;