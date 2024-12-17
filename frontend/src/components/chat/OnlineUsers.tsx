// src/components/OnlineUsers.tsx

import React from "react";
import styled from "styled-components";
import "../../css/chat/OnlineUsers.css";
import { useNavigate } from "react-router-dom";

interface UsernameProps {
  isCurrent: boolean;
}

const UserItem = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Username = styled.span<UsernameProps>`
  font-weight: ${({ isCurrent }) => (isCurrent ? "bold" : "normal")};
`;

const Actions = styled.div`
  button {
    margin-left: 5px;
    padding: 5px;
    font-size: 12px;
    cursor: pointer;
  }
`;

interface OnlineUsersProps {
  users: string[];
  currentUser: string;
  sendDirectMessage: (user: string, message: string) => void;
  blockUser: (action: "block", user: string) => void;
  inviteToGame: (user: string) => void;
  viewProfile: (user: string) => void;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({
  users,
  currentUser,
  sendDirectMessage,
  blockUser,
  inviteToGame,
  viewProfile,
}) => {

  const navigate = useNavigate();
  return (
    <div>
      {users.map((user) => (
        <UserItem key={user} className="d-flex flex-column mt-3 user-card">
          <Username isCurrent={user === currentUser}>{user}</Username>
          {user !== currentUser && (
            <Actions className="d-flex mt-2 user-card-item">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const message = prompt(`Send a DM to ${user}:`);
                  if (message) sendDirectMessage(user, message);
                }}
              >
                DM
              </button>
              <button
                className="btn btn-primary"
                onClick={() => inviteToGame(user)}
              >
                Invite Pong
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/users/${user}`)}
              >
                Profile
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Block user '${user}'?`)) {
                    blockUser("block", user);
                  }
                }}
              >
                Block
              </button>
            </Actions>
          )}
        </UserItem>
      ))}
    </div>
  );
};

export default OnlineUsers;
