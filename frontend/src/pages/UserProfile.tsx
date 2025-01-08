import React, { useEffect, useState } from "react";
import { User } from "../components/utils/api";
import { returnName } from "../components/utils/userService";
import "../css/UserProfile.css";
import axiosInstance from "../components/utils/AxiosInstance";
import { useAuth } from "../components/utils/AuthContext";
import { useNavigate } from "react-router-dom";
import ChangeDetails from "../components/users/ChangeDetails";
import SpinningLogo from "../components/SpinningLogo";
import { Link } from "react-router-dom";

type UserProfileProps = {
  userId: number;
};

const getCurrentUser = async (): Promise<number | null> => {
  try {
    const response = await axiosInstance.get("/users/me/");
    return response.data.user_id;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
};

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const navigate = useNavigate();
  const logout = useAuth().logout;

  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opponentNames, setOpponentNames] = useState<{ [key: number]: string }>(
    {}
  );
  const [currentUser, setCurrentUser] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userId = await getCurrentUser();
      setCurrentUser(userId);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}/`);
        if (response.status === 200 && response.data) setUser(response.data);
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchUser();
  }, [userId]);

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
  }, [user]);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user || !user.avatar) return; // Skip if no avatar is available

      try {
        const response = await fetch(`/api${user.avatar}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user avatar");
        }
        const avatarData = await response.blob();
        const avatarUrl = URL.createObjectURL(avatarData);
        setAvatar(avatarUrl);

        // Debugging: Log the URL
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchAvatar();

    // Cleanup: Revoke object URLs to prevent memory leaks
    return () => {
      if (avatar) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [user]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!user) return <SpinningLogo />;
  //   if (currentUser === null) return <div className="text-center mt-5">Currentuser not loaded</div>;

  const logoutLink = () => {
    logout();
    setTimeout(() => navigate("/"), 1000);
    return <div>Logging out......</div>;
  };

  const changeDetails = () => {
    setShowDetails(true);
  };

  const handleReturnToProfile = () => {
	setShowDetails(false);
};

  return (
    <div className="container d-flex align-items-center justify-content-center">
        <div className="card profile-card mx-auto">
          <div className="card-header profile-header text-center">
            <img
              src={avatar || "/images/default_avatar.jpg"}
              alt={`${user.firstName}'s avatar`}
              className="profile-avatar"
            />
          </div>
          <div className="card-body profile-body">
            <h4 className="profile-title">{user.firstName}</h4>
            <p className="profile-username">@{user.username}</p>
            <div className="list-group profile-info">
              <div className="list-group-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="list-group-item">
                {/* <strong>Status:</strong> <span className={`status ${user.onlineStatus.toLowerCase()}`}>{user.onlineStatus}</span> */}
              </div>
              <div className="list-group-item">
                <strong>Friends:</strong> {user.friends.length} friends
              </div>
            </div>
          </div>
          {/* <div className="card-footer profile-footer">
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
        </div> */}
          {currentUser === userId && (
            <div className="card-footer profile-footer d-flex justify-content-between">
              <Link to="/users/edit" className="btn btn-primary"> Change details</Link>
              <button onClick={logoutLink} className="btn btn-danger">
                Log out
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default UserProfile;
