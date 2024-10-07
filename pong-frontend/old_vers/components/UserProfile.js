import React, { useState } from 'react';
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
          <button 
            className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-600 transition"
            onClick={handleProfilePicChange}
          >
            <FaCamera />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-emerald-500">{username}</h2>
          <button 
            className="flex items-center text-blue-500 hover:text-blue-700 transition mt-2"
            onClick={() => alert('Username edit feature coming soon!')}
          >
            <FaUserEdit className="mr-2" /> Edit Username
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">{matchesPlayed}</h3>
          <p className="text-gray-500">Matches Played</p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold">{matchesWon}</h3>
          <p className="text-gray-500">Matches Won</p>
        </div>
      </div>

      <div className="mt-6">
        <button 
          className="w-full py-2 bg-slate-700 text-white font-bold rounded-md hover:bg-slate-800 transition"
          onClick={() => alert('Change Password feature coming soon!')}
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
