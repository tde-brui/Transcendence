import React from "react";
import { Navbar, Nav } from "react-bootstrap";

const NavBar: React.FC<{ username: string }> = ({ username }) => {
  return (
    <Navbar
      bg="transparent"
      variant="dark"
      expand="lg"
      className="w-100 fs-4 fixed-top"
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
  );
};

export default NavBar;