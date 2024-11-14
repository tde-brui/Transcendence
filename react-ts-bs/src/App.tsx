import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import Home from './Home';
import UserProfile from './UserProfile';
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    // <Router>
    //   <div
    //     className="App"
    //     style={{
    //       backgroundImage: `url('/BG.jpg')`,
    //       backgroundSize: 'cover',
    //       backgroundPosition: 'center',
    //       backgroundRepeat: 'no-repeat',
    //       backgroundAttachment: 'fixed',
    //       height: '100vh',
    //     }}
    //   >
    //     {loggedIn ? (
    //       <Routes>
    //         <Route path="/" element={<Home userId={1} />} />
    //         <Route path="/account" element={<UserProfile userId={1}  />} />
    //       </Routes>
    //     ) : (
    //       <LandingPage onLogin={() => setLoggedIn(true)} />
    //     )}
    //   </div>
    // </Router>
      <div
        className="App"
        style={{
          backgroundImage: `url('/BG.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          height: '100vh',
        }}
      >
      <Home userId={2} />
      </div>
      
  );
}

export default App;

