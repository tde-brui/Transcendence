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
  }
`;

function App() {
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (username.trim() !== '' && roomName.trim() !== '') {
      setIsConnected(true);
    } else {
      alert('Please enter both username and room name.');
    }
  };

  if (!isConnected) {
    return (
      <LoginContainer>
        <h2>Welcome to the Chat App</h2>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={handleConnect}>Join Chat</button>
      </LoginContainer>
    );
  }

  return (
    <AppContainer>
      <Chat username={username} roomName={roomName} />
    </AppContainer>
  );
}

export default App;
