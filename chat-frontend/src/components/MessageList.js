// src/components/MessageList.js

import React from 'react';
import styled from 'styled-components';

const ListContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
`;

const MessageItem = styled.div`
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 5px;
  background-color: ${({ isOwn }) => (isOwn ? '#dcf8c6' : '#fff')};
  align-self: ${({ isOwn }) => (isOwn ? 'flex-end' : 'flex-start')};
  max-width: 60%;
`;

const Sender = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

function MessageList({ messages, currentUser }) {
  return (
    <ListContainer>
      {messages.map((msg) => (
        <MessageItem key={msg.id} isOwn={msg.sender === currentUser}>
          <Sender>{msg.sender}</Sender>
          <div>{msg.message}</div>
        </MessageItem>
      ))}
    </ListContainer>
  );
}

export default MessageList;
