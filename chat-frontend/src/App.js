// src/App.js

import React, { useState } from 'react';
import Chat from './components/Chat';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;

  input {
    margin: 5px;
    padding: 10px;
    width: 200px;
  }

  button {
    padding: 10px 20px;
    margin-top: 10px;
    cursor: pointer;
  }
`;

function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (username.trim() !== '') {
      setIsConnected(true);
    } else {
      alert('Please enter a username.');
    }
  };

  if (!isConnected) {
    return (
      <LoginContainer>
        <h2>Welcome to the Global Chat App</h2>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={handleConnect}>Join Chat</button>
      </LoginContainer>
    );
  }

  return (
    <AppContainer>
      <Chat username={username} />
    </AppContainer>
  );
}

export default App;
