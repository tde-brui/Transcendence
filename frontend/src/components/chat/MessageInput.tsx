// src/components/MessageInput.tsx

import React, { useState, FormEvent, ChangeEvent } from 'react';
import styled from 'styled-components';
import '../../css/chat/MessageInput.css';

const InputContainer = styled.form`
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 0 20px;
  margin-left: 10px;
  font-size: 16px;
  cursor: pointer;
`;

interface MessageInputProps {
  sendMessage: (message: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() !== '') {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <InputContainer onSubmit={handleSubmit}>
      <input className='message-input'
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={handleChange}
        required
      />
      <button className="btn btn-primary send-button" type="submit">Send</button>
    </InputContainer>
  );
}

export default MessageInput;