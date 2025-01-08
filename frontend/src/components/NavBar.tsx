import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import "../css/NavBar.css";

const NavBar: React.FC<{ username: string }> = ({ username }) => {
  return (
	<div className="">
    <Navbar
      bg="transparent"
      variant="dark"
      className="w-100 fs-4 fixed-top"
    >
      <Nav className="mx-auto text-center glass-navx mt-5">
		<Nav.Link href="/" className="glass-navx-item">
		  HOME
		</Nav.Link>
        <Nav.Link href="/play" className="glass-navx-item">
          PLAY
        </Nav.Link>
        <Nav.Link href="/chat" className="glass-navx-item">
          CHAT
        </Nav.Link>
        <Nav.Link href={`/users/${username}`} className="glass-navx-item">
          ACCOUNT
        </Nav.Link>
        <Nav.Link href="/users" className="glass-navx-item">
          USERS
        </Nav.Link>
		<Nav.Link href="/friends" className="glass-navx-item">
		  FRIENDS
		</Nav.Link>
      </Nav>
    </Navbar>
	</div>
  );
};

export default NavBar;