import React from 'react';

function Signin() {
  return (
    <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-md text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-400">Sign In</h1>
      <p className="text-lg text-gray-400 mb-6">Please log in to access your account.</p>

      <div className="space-y-4">
        <input
          type="email"
          className="w-full px-4 py-2 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Email"
        />
        <input
          type="password"
          className="w-full px-4 py-2 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Password"
        />
      </div>

      <div className="mt-6">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
          Sign In
        </button>
      </div>
    </div>
  );
}

export default Signin;
