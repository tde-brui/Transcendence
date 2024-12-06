import Register from "./pages/RegisterPage";
import "./App.css";
import UserProfile from "./pages/UserProfile";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/HomePage";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import NotFoundPage from "./error_pages/404NotFound";
import OTPBoxed from "./components/OTPBoxed";
import Authenticate42 from "./pages/Authenticate42";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import UserProfileWrapper from "./components/UserProfileWrapper";
import CallBack from "./pages/CallBack";
import ChangeDetails from "./components/ChangeDetails";
import UsersPage from "./pages/UsersPage";

function App() {
  const userId = useAuth().userId;
  const { isAuthChecked } = useAuth();

  return (
    // <div className="App" style={{ backgroundImage: 'url(./BG.jpg)'}}>
    <div className="App">
      <Router>
        <Routes>
          <Route path="/hello" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <LoginPage userId={userId} isAuthChecked={isAuthChecked} />
            }
          />
          <Route
            path="/register"
            element={<Register userId={userId} isAuthChecked={isAuthChecked} />}
          />
		  <Route path="/42-login" element={<Authenticate42 />} />
		  <Route path="/42-callback" element={<CallBack />} />
          <Route path="*" element={<NotFoundPage />} />
          
          <Route
            path="/"
            element={<Home userId={userId} isAuthChecked={isAuthChecked} />}
          />
          {/* <Route element={<ProtectedRoute />} > */}
          {/* <Route path="/account" element={<UserProfile userId={userId} />} /> */}
          {/* </Route> */}
		  <Route path="/users/:username" element={<UserProfileWrapper />} />
		  <Route path="/users" element={<UsersPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
