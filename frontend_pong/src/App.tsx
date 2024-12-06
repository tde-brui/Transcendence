import React from 'react';
import logo from './logo.svg';
import './App.css';
import PingPongCanvas from './game';
import LocalPongCanvas from './LocalPongCanvas';

function App() {
  return (
    <div className="App">
     {/* <PingPongCanvas /> */}
     <LocalPongCanvas />
    </div>
  );
}

export default App;
