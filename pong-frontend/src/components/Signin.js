import React from "react";

function Signin() {
  return (
    <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-md text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-400">Sign In</h1>
      <p className="text-lg text-gray-400 mb-6">
        Please log in to access your account.
      </p>

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

      <div className="mt-6 flex justify-center gap-6 ">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
          Sign In
        </button>
        <a
          href="https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-3aeda8c49e6d2ed0568021d269b3069ef5743184b91aa4a6af12a32741055a1d&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Faccount&response_type=code"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <span>Sign In With</span>
          <img src="/42.png" alt="42 Logo" className="ml-2 w-6 h-6" />
        </a>
      </div>
    </div>
  );
}

export default Signin;
