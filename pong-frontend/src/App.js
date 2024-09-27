import React, { Component } from "react";
import { Route, NavLink, Routes, HashRouter } from "react-router-dom";

import Home from "./components/Home";
import About from "./components/UserProfile";
import Contact from "./components/Contact";
import UserProfile from "./components/UserProfile";
import './App.css';

class App extends Component {
render() {
  return (
    <HashRouter>
      <div className="App">
        <h1>Pong</h1>
        <ul className="header">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/userprofile">User</NavLink></li>
          <li><NavLink to="/contact">Contact</NavLink></li>
        </ul>
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Home />}></Route>
            <Route exact path="/userprofile" element={<UserProfile />}></Route>
            <Route exact path="/contact" element={<Contact />}></Route>
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
}

export default App;