import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";
import SettingsScreen from "./components/SettingsScreen";
import AccountScreen from "./components/AccountScreen";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function MainScreen() {
  const [hovered, setHovered] = React.useState(false);
  const springProps = useSpring({
    transform: hovered ? "scale(1.2)" : "scale(1)", // Scale up on hover
    config: { tension: 300, friction: 10 }, // Animation speed and smoothness
  });

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 vw-100">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-center bg-dark vh-100 vw-100">
        <animated.div
          className="z-10"
          style={springProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <h1 className="display-1 text-white font-gaming">Pong</h1>
        </animated.div>
      </div>
      {/* Buttons */}
      <div className="d-flex flex-column align-items-center mt-3 z-10">
        <Link to="/play" className="btn btn-lg btn-primary mb-3 disabled">
          Play
        </Link>
        <Link to="/settings" className="btn btn-lg btn-primary mb-3">
          Settings
        </Link>
        <Link to="/account2" className="btn btn-lg btn-primary mb-3">
          Account
        </Link>
        <Link to="/chat" className="btn btn-lg btn-danger mb-3">
          Chat
        </Link>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation(); // Moved here to be within Router context

  const isMainScreen = location.pathname === "/";

  return (
    <div className="position-relative vh-100 vw-100 d-flex flex-column align-items-center justify-content-center text-center">
      {/* Background Image */}
      {isMainScreen && (
        <img
          src="/BG.jpg"
          alt="background"
          className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover z-0"
        />
      )}

      {/* Main Screen or Routes */}
      {isMainScreen ? (
        <MainScreen />
      ) : (
        <div className="z-10 w-100 h-100">
          <Routes>
            {/* <Route path="/play" element={<PlayScreen />} /> */}
            <Route path="/settings" element={<SettingsScreen />} />
            <Route
              path="/account"
              element={<AccountScreen isLoggedIn={true} />}
            />
            <Route
              path="/account2"
              element={<AccountScreen isLoggedIn={false} />}
            />
            {/* <Route path="/chat" element={<ChatScreen />} /> */}
          </Routes>
        </div>
      )}
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
