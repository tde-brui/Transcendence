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
  blockUser: (action: "block" | "unblock", user: string) => void;
  inviteToGame: (user: string) => void;
  viewProfile: (user: string) => void;
  blockedUsers: string[]; // Add this prop
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({
  users,
  currentUser,
  sendDirectMessage,
  blockUser,
  inviteToGame,
  viewProfile,
  blockedUsers, // Destructure blockedUsers prop
}) => {
  const isBlocked = (user: string) => {
    return blockedUsers.includes(user);
  };
  
  const navigate = useNavigate();
  return (
    <div>
      {users.map((user) => (
        <UserItem
          key={user}
          className={`d-flex flex-column mt-3 user-card ${isBlocked(user) ? "blocked-user" : ""}`}
        >
          <Username isCurrent={user === currentUser}>{user}</Username>
          {user !== currentUser && (
            <Actions className="d-flex mt-2 user-card-item">
              <button
                className="btn btn-primary"
                disabled={isBlocked(user)} // Disable DM if the user is blocked
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
              {isBlocked(user) ? (
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    if (window.confirm(`Unblock user '${user}'?`)) {
                      blockUser("unblock", user);
                    }
                  }}
                >
                  Unblock
                </button>
              ) : (
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
              )}
            </Actions>
          )}
        </UserItem>
      ))}
    </div>
  );
};

export default OnlineUsers;
