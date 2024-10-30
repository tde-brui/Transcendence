import React from "react";
import Signin from "./Signin"; // Assuming you have a Signin component

interface AccountSettingsProps {
	isLoggedIn: boolean;
  }

  function AccountSettings({ isLoggedIn }: AccountSettingsProps) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
      {/* Conditional Rendering based on login status */}
      {isLoggedIn ? (
        <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-lg">
          <h1 className="text-4xl font-bold mb-4 text-blue-400">
            Account Settings
          </h1>
          <p className="text-lg text-gray-400 mb-6">
            Manage your account details below:
          </p>

          <div className="space-y-4">
            {/* Account Info Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-200">
                Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
              Save
            </button>
            <button className="text-red-500 hover:text-red-600 font-semibold">
              Logout
            </button>
          </div>
        </div>
      ) : (
        <Signin />
      )}
    </div>
  );
}

export default AccountSettings;
