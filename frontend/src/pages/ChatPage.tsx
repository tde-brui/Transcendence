import React, { useState, useEffect } from "react";
import "../css/UserProfile.css";

const ChatPage: React.FC = () => {
  
  return (
    <div className="container d-flex flex-column align-items-center justify-content-center">
      <div className="card profile-card mx-auto"> 
	  	<div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">Chat </h4>
        </div>
		<div className="card-body profile-body">
			<h4> Hier komt binnenkort de geweldige chatpage</h4>
			<img src="/images/logo192.png" alt="Under construction"/>
		</div>
	  </div>
    </div>
  );
};

export default ChatPage;
