import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import UserProfile from "../../pages/UserProfile";
import NotFoundPage from "../../error_pages/404NotFound";
import axiosInstance from "../utils/AxiosInstance";
import axios from "axios";
import SpinningLogo from "../SpinningLogo";
import { createBigIntLiteral } from "typescript";
import ChangeDetails from "./ChangeDetails";

// Define your axios instance

interface User {
	username: string;
	firstName: string;
	email: string;
	twoFactorEnabled: boolean;
	avatar: string;
	id: number;
}


const getUserId = async (): Promise<number| null> => {
	try {
	  const response = await axiosInstance.get("/users/me/");
	  const userId = response.data.user_id;
		
	return userId;
	} catch (error) {
	  console.error("Error fetching username:", error);
	  throw new Error("Unable to fetch username");
	}
  };
  
const getUser = async (userId : number): Promise<User | null> => {
	try {
		const response = await axiosInstance.get(`/users/${userId}/`);
		return response.data;
	} catch (error) {
		console.error("Failed to fetch user data", error);
		return null;
	}
}

const ChangeDetailWrapper = () => {
 const [user, setUser] = useState<User | null>(null);
 const [userId, setUserId] = useState<number | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [avatar, setAvatar] = useState<string | null>(null);

 useEffect(() => {
    const fetchCurrentUser = async () => {
      const userId = await getUserId();
      setUserId(userId);
    };

    fetchCurrentUser();
  }, []);

 useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}/`);
        if (response.status === 200 && response.data)
			setUser(response.data);
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchUser();
  }, [userId]);

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

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

  if (userId === null) {
    return <NotFoundPage />;
  }

  if (!userId) {
	return <SpinningLogo />;
  }

  if (!user) {
	return <SpinningLogo />;
  }

  return <ChangeDetails
  username={user.username}
  firstName={user.firstName}
  email={user.email}
  twoFactorEnabled={user.twoFactorEnabled}
  avatarUrl={avatar || "/images/default_avatar.jpg"}
  userId={user.id}
/>;
};

export default ChangeDetailWrapper;
