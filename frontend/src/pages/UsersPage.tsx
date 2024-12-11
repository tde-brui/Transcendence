import React, { useEffect, useState } from "react";
import axiosInstance from "../components/AxiosInstance";
import "../css/UserProfile.css";
import { Link, useNavigate } from "react-router-dom";

interface User {
  id: number;
  firstName: string;
  username: string;
  avatar: string; // Path to the user's avatar (not the full URL)
}

const UsersPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
          <ul className="d-flex flex-column align-items-center justify-content-center">
            {users.map((user) => (
              <li key={user.id} className="d-flex mt-2 users-list-body align-items-center justify-content-between">
				  <div className="d-flex align-items-center justify-content-between">
                <img
                  src={avatars[user.id] || ""}
                  alt={`${user.username}'s avatar`}
                  className="users-avatar"
                />
					<div className="d-flex flex-column align-items-start ms-3">
					<strong>{user.firstName}</strong>
					@{user.username}
					</div>
				</div>
					<div className="d-flex ms-5">
						<Link to={`/users/${user.username}`} className="btn btn-primary ms-3">
							View
						</Link>
						<button className="btn btn-success ms-3">Add</button>
					</div>
              </li>
            ))}
          </ul>
        </div>
		<div className="card-footer profile-footer d-flex">
			Total users: {users.length}
		</div>
      </div>
    </div>
  );
};

export default UsersPage;
