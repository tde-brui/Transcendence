import React, { useEffect, useState } from "react";
import { User } from "./api";
import { returnName } from "./userService";
import "../css/UserProfile.css";
import { NotLoggedIn } from "./notLoggedin";
import axiosInstance from "./AxiosInstance";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import ChangeDetails from "./ChangeDetails";

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
  const [opponentNames, setOpponentNames] = useState<{ [key: number]: string }>({});
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
        const response = await fetch(`http://localhost:8000/users/${userId}/`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const userData = await response.json();
        setUser(userData);
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
        const response = await fetch(`http://localhost:8000${user.avatar}`);
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
  if (!user) return <div></div>;
  //   if (currentUser === null) return <div className="text-center mt-5">Currentuser not loaded</div>;

  const logoutLink = () => {
    logout();
    navigate("/");
    return <div>Logging out......</div>;
  };

  	
  const changeDetails = () => {
	const username = user.username;
	const firstName = user.firstName;
	const email = user.email;
	const twoFactorEnabled = user.twoFactorEnabled;
	const avatarUrl = avatar || "/images/default_avatar.jpg";
	const onEditAvatar = () => console.log("Edit avatar clicked");
	const onChangePassword = () => console.log("Change password clicked");
	const onSubmit = (updatedDetails: any) => console.log("Updated details:", updatedDetails);

	console.log("Change details clicked");
	return <ChangeDetails 
	username={username}
	firstName={firstName}
	email={email}
	twoFactorEnabled={twoFactorEnabled}
	avatarUrl={avatarUrl}
	onEditAvatar={onEditAvatar}
	onChangePassword={onChangePassword}
	onSubmit={onSubmit}
	/>;

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
            <button onClick={changeDetails} className="btn btn-primary">Change details</button>
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
