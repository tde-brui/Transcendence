import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';

const Home: React.FC = () => {
  return (
    <div className="container">
      <Container>
      <Navbar bg="transparent" variant="dark" expand="lg" className="w-100 fs-4">
        <Nav className="mx-auto text-center glass-nav">
          <Nav.Link href="#play" className="glass-nav-item">PLAY</Nav.Link>
          <Nav.Link href="#chat" className="glass-nav-item">CHAT</Nav.Link>
          <Nav.Link href="account" className="glass-nav-item">ACCOUNT</Nav.Link>
          <Nav.Link href="#settings" className="glass-nav-item">SETTINGS</Nav.Link>
        </Nav>
      </Navbar>
    </Container>
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <h1 className="text-white fst-italic playfair-text mb-4">WELCOME TO PONG</h1>
      </div>
    </div>
  );
};

export default Home;
