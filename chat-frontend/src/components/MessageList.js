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
  background-color: ${({ isOwn, isDM, isAnnouncement }) => {
    if (isAnnouncement) return '#FFD700'; // Gold color for announcements
    if (isDM) return '#DCF8C6'; // Light green for DMs
    return isOwn ? '#dcf8c6' : '#fff'; // Differentiate own messages
  }};
  align-self: ${({ isOwn }) => (isOwn ? 'flex-end' : 'flex-start')};
  max-width: 60%;
  border: ${({ isAnnouncement }) => (isAnnouncement ? '2px solid #FFA500' : 'none')};
`;

const Sender = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

function MessageList({ messages, currentUser }) {
  return (
    <ListContainer>
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          isOwn={msg.sender === currentUser}
          isDM={msg.isDM}
          isAnnouncement={msg.isAnnouncement}
        >
          {msg.isAnnouncement ? (
            <Sender>Announcement by {msg.sender}</Sender>
          ) : msg.isDM ? (
            <Sender>{msg.sender}</Sender>
          ) : (
            <Sender>{msg.sender}</Sender>
          )}
          <div>{msg.message}</div>
        </MessageItem>
      ))}
    </ListContainer>
  );
}

export default MessageList;
