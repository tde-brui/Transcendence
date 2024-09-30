import React, { Component } from "react";
import Pong3D from "./driedtest";

class Home extends Component {
  render() {
    return (
      <div>
        <h3>SPA App - Home</h3>
        <p>This is a paragraph on the HomePage of the SPA App.</p>
		< Pong3D />
      </div>
    );
  }
}

export default Home;