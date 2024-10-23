import React, { useState } from "react";
import Signin from "./Signin"; // Assuming you have a Signin component
import AccountSettings from "./AccountSettings"; // Assuming you have an AccountSettings component

function AccountScreen({ isLoggedIn }) {
  // State to manage whether the user is viewing the account overview or editing it
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
      {/* Conditional Rendering based on login status */}
      {isLoggedIn ? (
        <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-lg text-center">
          {/* Conditional Rendering: If editing, show AccountSettings, otherwise show overview */}
          {!isEditing ? (
            <>
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <img
                  src="https://via.placeholder.com/150" // Replace with actual profile picture URL
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-blue-400 object-cover"
                />
              </div>

              {/* Main Account Overview */}
              <h1 className="text-4xl font-bold mb-4 text-blue-400">
                My Account
              </h1>

              {/* Account Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-700 pb-4">
                  <h2 className="text-xl font-semibold">Username</h2>
                  <p className="text-gray-300">User12345</p>
                </div>

                <div className="border-b border-gray-700 pb-4">
                  <h2 className="text-xl font-semibold">Email</h2>
                  <p className="text-gray-300">user@example.com</p>
                </div>

                <div className="border-b border-gray-700 pb-4">
                  <h2 className="text-xl font-semibold">Wins</h2>
                  <p className="text-gray-300">0</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-between items-center">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() => setIsEditing(true)} // Switch to account settings view on click
                >
                  Edit Profile
                </button>
                <button className="text-red-500 hover:text-red-600 font-semibold">
                  Logout
                </button>
              </div>
            </>
          ) : (
            // Make sure AccountSettings has the same layout styling
            <div className="w-full max-w-lg">
              <AccountSettings isLoggedIn={true} />
            </div>
          )}
        </div>
      ) : (
        <Signin />
      )}
    </div>
  );
}

export default AccountScreen;
