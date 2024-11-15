// src/UserProfile.tsx

import React, { useEffect, useState } from 'react';
import { User } from './api'; // Assuming User type is defined in api.ts
import { returnName } from './userService';
import './css/UserProfile.css'; // Optional: for custom styling if needed

type UserProfileProps = {
  userId: number;
};

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opponentNames, setOpponentNames] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://localhost:5002/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user data1");
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchUser();
  }, [userId]);

  // Fetch opponent names
  useEffect(() => {
    const fetchOpponentNames = async () => {
      if (!user?.matchHistory) return;

      const opponentNamesMap: { [key: number]: string } = {};
      for (const match of user.matchHistory) {
        if (!opponentNames[match.opponentId]) {
          const username = await returnName(match.opponentId);
          opponentNamesMap[match.opponentId] = username;
        }
      }
      setOpponentNames((prev) => ({ ...prev, ...opponentNamesMap }));
    };

    fetchOpponentNames();
  }, [user, opponentNames]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!user) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container d-flex align-items-center justify-content-center">
      <div className="card profile-card mx-auto">
        <div className="card-header profile-header text-center">
          <img
            src={user.avatar || '/images/default_avatar.png'}
            alt={`${user.displayName}'s avatar`}
            className="profile-avatar"
          />
        </div>
        <div className="card-body profile-body">
          <h4 className="profile-title">{user.displayName}</h4>
          <p className="profile-username">@{user.username}</p>
          <div className="list-group profile-info">
            <div className="list-group-item">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="list-group-item">
              <strong>Status:</strong> <span className={`status ${user.onlineStatus.toLowerCase()}`}>{user.onlineStatus}</span>
            </div>
            <div className="list-group-item">
              <strong>Friends:</strong> {user.friends.length} friends
            </div>
          </div>
        </div>
        <div className="card-footer profile-footer">
          <h5 className="match-history-title">Match History</h5>
          <ul className="list-group match-history-list">
            {user.matchHistory.length > 0 ? (
              user.matchHistory.map((match, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between">
                  <span>Opponent: {opponentNames[match.opponentId] || "Loading..."}</span>
                  <span>{match.result} on {new Date(match.date).toLocaleDateString()}</span>
                </li>
              ))
            ) : (
              <li className="list-group-item text-center">No matches yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
