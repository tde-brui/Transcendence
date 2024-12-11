// src/components/Notifications.js

import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
`;

const Notification = styled.div`
  background-color: #323232;
  color: #fff;
  padding: 10px 20px;
  margin-bottom: 10px;
  border-radius: 4px;
  animation: ${fadeIn} 0.5s ease-out;
`;

function Notifications({ notifications }) {
  return (
    <NotificationContainer>
      {notifications.map((note) => (
        <Notification key={note.id}>{note.message}</Notification>
      ))}
    </NotificationContainer>
  );
}

export default Notifications;
