import React, { useEffect, useState } from "react";
import axiosInstance from "../components/AxiosInstance";
import "../css/UserProfile.css";

interface User {
  id: number;
  firstName: string;
  username: string;
  avatar: string; // Path to the user's avatar (not the full URL)
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [avatars, setAvatars] = useState<Record<number, string>>({}); // Stores avatar URLs by user ID
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get<User[]>("/users/");
        setUsers(response.data);
      } catch (err) {
        setError("Failed to load users.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAvatars = async () => {
      const avatarPromises = users.map(async (user) => {
        if (!user.avatar) return; // Skip if no avatar

        try {
          const response = await fetch(`http://localhost:8000${user.avatar}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch avatar for user ${user.id}`);
          }
          const avatarData = await response.blob();
          const avatarUrl = URL.createObjectURL(avatarData);

          // Store avatar URL in state
          setAvatars((prevAvatars) => ({
            ...prevAvatars,
            [user.id]: avatarUrl,
          }));
        } catch (err) {
          console.error(`Error fetching avatar for user ${user.id}:`, err);
        }
      });

      await Promise.all(avatarPromises); // Wait for all avatar fetches to complete
    };

    if (users.length > 0) {
      fetchAvatars();
    }
  }, [users]);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container d-flex align-items-center justify-content-center">
      <div className="card profile-card mx-auto">
        <div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">Users list </h4>
        </div>
        <div className="card-body profile-body">
          <ul className="d-flex flex-column">
            {users.map((user) => (
              <li key={user.id} className="d-flex">
                <img
                  src={avatars[user.id] || ""}
                  alt={`${user.username}'s avatar`}
                  className="users-avatar"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="d-flex flex-column align-items-start">
                  <p>
                    <strong>{user.firstName}</strong>
                  </p>
                  <p>@{user.username}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
