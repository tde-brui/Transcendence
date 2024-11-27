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
import TestCookie from "./pages/TestCookie";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  const userId = useAuth().userId;
  const { isAuthChecked } = useAuth();

 
  return (
    // <div className="App" style={{ backgroundImage: 'url(./BG.jpg)'}}>
	<div className="App">
      <Router>
        <Routes>
          <Route path="/hello" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage userId={userId} isAuthChecked={isAuthChecked}/>} />
          <Route path="/register" element={<Register userId={userId} isAuthChecked={isAuthChecked} />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/test" element={<Authenticate42 />} />
        	<Route path="/" element={<Home userId={userId} isAuthChecked={isAuthChecked} />} />
		  {/* <Route element={<ProtectedRoute />} > */}
          	<Route path="/account" element={<UserProfile userId={userId} />} />
		  {/* </Route> */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
