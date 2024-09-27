// src/components/UserProfile.js
import React, { useState } from 'react';
import './UserProfile.css';
import { FaCamera, FaUserEdit } from 'react-icons/fa';

const UserProfile = () => {
  // State for profile data
  const [username, setUsername] = useState('Quincy Promes');
  const [matchesPlayed, setMatchesPlayed] = useState(20);
  const [matchesWon, setMatchesWon] = useState(15);
  const [profilePic, setProfilePic] = useState('https://www.dutchnews.nl/wpcms/wp-content/uploads/2022/10/Quincy_Promes_in_2021-e1666337176929.jpg');

  // Function to handle profile picture change
  const handleProfilePicChange = () => {
    const newPic = prompt('Enter new profile picture URL:');
    if (newPic) setProfilePic(newPic);
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-picture">
          <img src={profilePic} alt="Profile" className="profile-img" />
          <button className="change-pic-btn" onClick={handleProfilePicChange}>
            <FaCamera /> Change
          </button>
        </div>
        <div className="username">
          <h2>{username}</h2>
          <button className="edit-username-btn" onClick={() => alert('Username edit feature coming soon!')}>
            <FaUserEdit /> Edit Username
          </button>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <h3>{matchesPlayed}</h3>
          <p>Matches Played</p>
        </div>
        <div className="stat">
          <h3>{matchesWon}</h3>
          <p>Matches Won</p>
        </div>
      </div>

      <div className="profile-actions">
        <button className="change-password-btn" onClick={() => alert('Change Password feature coming soon!')}>
          Change Password
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
