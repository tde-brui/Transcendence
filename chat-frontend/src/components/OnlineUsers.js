// src/components/OnlineUsers.js

import React from 'react';
import styled from 'styled-components';

const UserItem = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Username = styled.span`
  font-weight: ${({ isCurrent }) => (isCurrent ? 'bold' : 'normal')};
`;

const Actions = styled.div`
  button {
    margin-left: 5px;
    padding: 5px;
    font-size: 12px;
    cursor: pointer;
  }
`;

function OnlineUsers({
  users,
  currentUser,
  sendDirectMessage,
  blockUser,
  inviteToGame,
  viewProfile,
}) {
  return (
    <div>
      {users.map((user) => (
        <UserItem key={user}>
          <Username isCurrent={user === currentUser}>{user}</Username>
          {user !== currentUser && (
            <Actions>
              <button onClick={() => {
                const message = prompt(`Send a DM to ${user}:`);
                if (message) sendDirectMessage(user, message);
              }}>DM</button>
              <button onClick={() => {
                if (window.confirm(`Block user '${user}'?`)) {
                  blockUser('block', user);
                }
              }}>Block</button>
              <button onClick={() => inviteToGame(user)}>Invite Pong</button>
              <button onClick={() => viewProfile(user)}>Profile</button>
            </Actions>
          )}
        </UserItem>
      ))}
    </div>
  );
}

export default OnlineUsers;
