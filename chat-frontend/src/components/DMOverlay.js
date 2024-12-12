// src/components/DMOverlay.js

import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

const OverlayContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  max-height: 400px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
`;

const Header = styled.div`
  background-color: #4CAF50;
  color: white;
  padding: 10px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
`;

const MessageItem = styled.div`
  margin-bottom: 8px;
  padding: 6px 10px;
  background-color: ${({ isOwn }) => (isOwn ? '#dcf8c6' : '#f1f0f0')};
  border-radius: 4px;
  align-self: ${({ isOwn }) => (isOwn ? 'flex-end' : 'flex-start')};
  max-width: 80%;
`;

const InputContainer = styled.form`
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  font-size: 14px;
`;

const Button = styled.button`
  padding: 0 15px;
  margin-left: 5px;
  font-size: 14px;
  cursor: pointer;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
`;

function DMOverlay({ dm, sendDirectMessage, closeDM, currentUser }) {
  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      sendDirectMessage(dm.sender, message);
      setMessage('');
      // Optionally, add the message to the overlay immediately
      // Not implemented here to keep server as the source of truth
    }
  };

  return (
    <OverlayContainer>
      <Header>
        <span>DM with {dm.sender}</span>
        <CloseButton onClick={() => closeDM(dm.id)}>×</CloseButton>
      </Header>
      <MessagesContainer>
        {dm.messages.map(msg => (
          <MessageItem key={msg.id} isOwn={msg.sender === currentUser}>
            <div>{msg.message}</div>
          </MessageItem>
        ))}
      </MessagesContainer>
      <InputContainer onSubmit={handleSend}>
        <Input
          type="text"
          placeholder={`Message ${dm.sender}...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <Button type="submit">Send</Button>
      </InputContainer>
    </OverlayContainer>
  );
}

export default DMOverlay;
