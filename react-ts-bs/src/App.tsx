import Register from './components/Register';
import './App.css';
import UserProfile from './components/UserProfile';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import Home from './components/Home';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import NotFoundPage from './components/404NotFound';
import OTPBoxed from './components/OTPBoxed';

function App() {
  const userId = useAuth().userId;
  return (
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
		<Router>
		<Routes>
			<Route path="/hello" element={<LandingPage />} />
			<Route path="/" element={<Home userId={userId}/>} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<Register />} />
			<Route path="/account" element={<UserProfile userId={userId} />} />
			<Route path="*" element={<NotFoundPage />} />
			<Route path="/test" element={<OTPBoxed userId={2}/> } />
		</Routes>
		</Router>

	  
      </div>
      
  );
}

export default App;

