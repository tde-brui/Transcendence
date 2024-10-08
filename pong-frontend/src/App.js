import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import PlayScreen from './components/PlayScreen';
import SettingsScreen from './components/SettingsScreen';
import AccountScreen from './components/AccountScreen';
import ChatScreen from './components/ChatScreen';
import './App.css';

function MainScreen() {
  const [hovered, setHovered] = React.useState(false);
  const springProps = useSpring({
    transform: hovered ? 'scale(1.2)' : 'scale(1)',// Scale up on hover
    config: { tension: 300, friction: 10 }, // Animation speed and smoothness
  });

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
      {/* Title */}
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <animated.div
          className="z-10"
          style={springProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <h1 className="text-9xl text-white font-gaming">Pong</h1>
        </animated.div>
      </div>
      {/* Buttons */}
      <div className="h-screen w-screen flex flex-col flex-start space-between z-10 space-x-6">
        <Link to="/play" className="text-4xl text-white font-bold p-3 custom-link">
          PLAY
        </Link>
        <Link to="/settings" className="text-4xl text-white font-bold p-3 custom-link">
          SETTINGS
        </Link>
        <Link to="/account2" className="text-4xl text-white font-bold p-3 custom-link">
          ACCOUNT
        </Link>
        <Link to="/chat" className="text-4xl text-white font-bold p-3 custom-link">
          CHAT
        </Link>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation(); // Moved here to be within Router context

  const isMainScreen = location.pathname === '/';

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center text-center">
      {/* Background Image */}
      {isMainScreen && (
        <img src="/BG.jpg" alt="background" className="absolute inset-0 w-full h-full object-cover z-0" />
      )}

      {/* Main Screen or Routes */}
      {isMainScreen ? (
        <MainScreen />
      ) : (
        <div className="z-10 w-full h-full">
          <Routes>
            <Route path="/play" element={<PlayScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/account" element={<AccountScreen isLoggedIn={true} />} />
			<Route path="/account2" element={<AccountScreen isLoggedIn={false} />} />
            <Route path="/chat" element={<ChatScreen />} />
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
