import Register from "./pages/RegisterPage";
import "./App.css";
import UserProfile from "./components/UserProfile";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/HomePage";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import NotFoundPage from "./error_pages/404NotFound";
import OTPBoxed from "./components/OTPBoxed";
import Authenticate42 from "./pages/Authenticate42";


function App() {
  const userId = useAuth().userId;
  return (
    <div className="App" style={{ backgroundImage: 'url(./BG.jpg)'}}>
      <Router>
        <Routes>
          <Route path="/hello" element={<LandingPage />} />
          <Route path="/" element={<Home userId={userId} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<UserProfile userId={2} />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/test" element={<Authenticate42 />} />
          <Route path="/test2" element={<OTPBoxed userId={3} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
