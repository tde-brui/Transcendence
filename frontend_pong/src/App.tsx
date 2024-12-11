import React from 'react';
import './App.css';
import RemotePongCanvas from './RemotePongCanvas';
import LocalPongCanvas from './LocalPongCanvas';
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
              <div style={{ textAlign: 'center' }}>
                <h1>Main Menu</h1>
                <Link to="/remote">
                  <button className="reset-button">Remote Play</button>
                </Link>
                <Link to="/local">
                  <button className="reset-button" style={{ marginLeft: '10px' }}>Local Play</button>
                </Link>
              </div>
            }
          />
          {/* Remote play page */}
          <Route
            path="/remote"
            element={<RemotePongCanvas />}
          />
          {/* Local play page */}
          <Route
            path="/local"
            element={<LocalPongCanvas />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
