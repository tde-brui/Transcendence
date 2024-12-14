import Register from "./pages/RegisterPage";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/HomePage";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAuth } from "./components/utils/AuthContext";
import NotFoundPage from "./error_pages/404NotFound";
import Authenticate42 from "./pages/Authenticate42";
import ProtectedRoute from "./components/utils/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import UserProfileWrapper from "./components/users/UserProfileWrapper";
import CallBack from "./pages/CallBack";
import UsersPage from "./pages/UsersPage";
import NavBar from "./components/NavBar";
import SpinningLogo from "./components/SpinningLogo";
import GameMainPage from "./pages/GameMainPage";
import RemoteLobbyList from "./components/game/RemoteLobbyList";
import RemotePongCanvas from "./components/game/RemotePongCanvas";
import LocalPongCanvas from "./components/game/LocalPongCanvas";

function App() {
  const userId = useAuth().userId;
  const { isAuthChecked } = useAuth();

  return (
    // <div className="App" style={{ backgroundImage: 'url(./BG.jpg)'}}>
    <div className="App">
	{/* <NavBar username="exampleUser" /> */}
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
          <Route path="/test" element={<SpinningLogo />} />

          <Route
            path="/"
            element={<Home userId={userId} isAuthChecked={isAuthChecked} />}
          />
          <Route element={<ProtectedRoute userId={userId}/>} >
          	<Route path="/users" element={<UsersPage />} />
          	<Route path="/users/:username" element={<UserProfileWrapper />} />
		  	<Route path="/chat" element={<ChatPage userId={userId} />} />
		  <Route path="/play" element={<GameMainPage />} />
		  <Route path="/play/remote" element={<RemoteLobbyList />} />
		  <Route path="/play/remote/:lobbyId" element={<RemotePongCanvas />} />
		  <Route path="/play/local" element={<LocalPongCanvas />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
