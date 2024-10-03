
import React, { Component } from 'react';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import UserProfile from './components/UserProfile'; // Assuming UserProfile is just a component for displaying the picture
import Contact from './components/Contact';
import { FaBars } from 'react-icons/fa'; // Use an icon or import an image
import backgroundImage from './assets/BG.jpg';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false, // State to toggle dropdown
    };
  }

  // Function to toggle the menu
  toggleMenu = () => {
    this.setState({ isMenuOpen: !this.state.isMenuOpen });
  };

  render() {
    const { isMenuOpen } = this.state;

    return (
      <HashRouter>
        <div
          className="App min-h-screen bg-cover bg-center relative"
          style={{ backgroundImage: "url('./assets/BG.jpg')" }} // Background image
        >
          {/* Title */}
          <h1 className="text-4xl font-bold text-center my-8 text-blue-500 mt-0 pt-5">Pong</h1>

          {/* Profile picture in the top-right */}
          <div className="absolute top-4 right-4">
            <button onClick={this.toggleMenu} className="focus:outline-none">
              {/* Profile Picture (Icon or Image) */}
              <FaBars className="text-4xl text-gray-600 hover:text-blue-500 transition duration-300" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                <ul className="py-2">
                  <li>
                    <NavLink
                      to="/"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      activeClassName="text-blue-500"
                      onClick={this.toggleMenu} // Close menu on click
                    >
                      Home
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/userprofile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      activeClassName="text-blue-500"
                      onClick={this.toggleMenu} // Close menu on click
                    >
                      User
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/contact"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      activeClassName="text-blue-500"
                      onClick={this.toggleMenu} // Close menu on click
                    >
                      Contact
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="content mx-auto mt-8 p-4 bg-white shadow-lg rounded-lg max-w-4xl">
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route exact path="/userprofile" element={<UserProfile />} />
              <Route exact path="/contact" element={<Contact />} />
            </Routes>
          </div>
        </div>
      </HashRouter>
    );
  }
}

export default App;
