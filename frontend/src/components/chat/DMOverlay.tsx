// src/components/DMOverlay.tsx

import React, { useState, FormEvent, ChangeEvent } from 'react';
import styled from 'styled-components';
import '../../css/chat/DMOverlay.css';

interface DMMessage {
  id: string;
  sender: string;
  message: string;
}

interface DM {
  id: string;
  sender: string;
  messages: DMMessage[];
}

interface DMOverlayProps {
  dm: DM;
  sendDirectMessage: (recipient: string, message: string) => void;
  closeDM: (dmId: string) => void;
  currentUser: string;
}

interface MessageItemProps {
  isOwn: boolean;
}

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

const MessageItem = styled.div<MessageItemProps>`
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

const DMOverlay: React.FC<DMOverlayProps> = ({ dm, sendDirectMessage, closeDM, currentUser }) => {
  const [message, setMessage] = useState('');

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() !== '') {
      sendDirectMessage(dm.sender, message);
      setMessage('');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <OverlayContainer>
      <Header>
        <span>DM with {dm.sender}</span>
        <CloseButton onClick={() => closeDM(dm.id)}>×</CloseButton>
      </Header>
      <MessagesContainer>
	  {dm.messages.map((msg) => {
        // Determine classes based on message properties
        const isOwn = msg.sender === currentUser;
        let bubbleClass = isOwn ? 'message-own' : 'message-other';
        let senderClass = isOwn ? 'sender-own' : 'sender-other';

        return (
          <div key={msg.id} className="message-item-container">
            {/* Text bubble for the message */}
            <div className={`message-bubble ${bubbleClass}`}>{msg.message}</div>
            {/* Sender below the text bubble */}
            <div className={`${senderClass}`}>{msg.sender}</div>
          </div>
        );
      })}
      </MessagesContainer>
      <InputContainer onSubmit={handleSend}>
        <Input
          type="text"
          placeholder={`Message ${dm.sender}...`}
          value={message}
          onChange={handleChange}
          required
        />
        <Button type="submit" className="btn btn-primary">Send</Button>
      </InputContainer>
    </OverlayContainer>
  );
}

export default DMOverlay;
