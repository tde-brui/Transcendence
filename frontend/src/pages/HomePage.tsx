import React, { useEffect, useState } from "react";
import { Navbar, Nav } from "react-bootstrap";
import { returnName } from "../components/utils/userService";
import { NotLoggedIn } from "../components/login/notLoggedin";
import { User } from "../components/utils/api";
import { Link } from "react-router-dom";
import axiosInstance from "../components/utils/AxiosInstance";
import "../index.css";
import SpinningLogo from "../components/SpinningLogo";

type UserProfileProps = {
  userId: number;
  isAuthChecked: boolean;
};

const Home: React.FC<UserProfileProps> = ({ userId, isAuthChecked }) => {
  NotLoggedIn(userId, isAuthChecked);

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get<User>(`/users/${userId}`);
        setUser(response.data);
        setUsername(response.data.username);
      } catch (error) {
        console.error("Failed to fetch user data", error);
        setError((error as Error).message);
      }
    };

    fetchUser();
  }, [userId]);

  //   if (error) return <div className="alert alert-danger">{error}</div>;
  if (!user) return <SpinningLogo />;

  return (
    <div className="container">
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <h1 className="fst-italic playfair-text text-uppercase mb-4">
          WELCOME {user.firstName}
        </h1>
        <Navbar
          bg="transparent"
          variant="dark"
          className="w-100 fs-4"
        >
          <Nav className="mx-auto text-center glass-nav">
            <Nav.Link href="play" className="glass-nav-item">
              PLAY
            </Nav.Link>
            <Nav.Link href="chat" className="glass-nav-item">
              CHAT
            </Nav.Link>
            <Nav.Link href={`/users/${username}`} className="glass-nav-item">
              ACCOUNT
            </Nav.Link>
            <Nav.Link href="/users" className="glass-nav-item">
              USERS
            </Nav.Link>
          </Nav>
        </Navbar>
      </div>
    </div>
  );
};

export default Home;
