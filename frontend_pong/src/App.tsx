import React from 'react';
import './App.css';
import RemotePongCanvas from './RemotePongCanvas';
import LocalPongCanvas from './LocalPongCanvas';
import RemoteLobbyList from './RemoteLobbyList';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Main menu page */}
          <Route
            path="/"
            element={
              <div style={{ textAlign: 'center', color: 'white' }}>
                <h1>Main Menu</h1>
                <Link to="/remote">
                  <button className="reset-button">Remote Play</button>
                </Link>
                <Link to="/local" style={{ marginLeft: '10px' }}>
                  <button className="reset-button">Local Play</button>
                </Link>
              </div>
            }
          />
          {/* Lobby menu */}
          <Route path="/remote" element={<RemoteLobbyList />} />
          {/* Specific lobby page */}
          <Route path="/remote/:lobbyId" element={<RemotePongCanvas />} />
          {/* Local play page */}
          <Route path="/local" element={<LocalPongCanvas />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
