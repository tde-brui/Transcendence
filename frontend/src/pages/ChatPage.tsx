import React, { useState, useEffect } from "react";
import "../css/ChatPage.css";

const ChatPage: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [chatLog, setChatLog] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    const stored = sessionStorage.getItem("blocked_users");
    return stored ? JSON.parse(stored) : [];
  });

  const [directChat, setDirectChat] = useState<{
    recipient: string | null;
    messages: string[];
  }>({ recipient: null, messages: [] });

  useEffect(() => {
    sessionStorage.setItem("blocked_users", JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return alert("Please enter a valid username!");
    sessionStorage.setItem("username", username);
  };

  const handleRoomJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return alert("Please enter a room name.");
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${wsProtocol}://${window.location.host}/ws/chat/${encodeURIComponent(
        roomName
      )}/?username=${encodeURIComponent(username!)}`
    );
    setWs(socket);

    socket.onopen = () => {
      setChatLog((prev) => `${prev}Joined room: ${roomName}\n`);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update_users") {
        setOnlineUsers(data.users);
      } else if (data.type === "chat") {
        if (!blockedUsers.includes(data.sender)) {
          setChatLog((prev) => `${prev}${data.sender}: ${data.message}\n`);
        }
      } else if (data.type === "direct") {
        if (!blockedUsers.includes(data.sender)) {
          setDirectChat((prev) => ({
            recipient: data.sender,
            messages: [...prev.messages, `${data.sender}: ${data.message}`],
          }));
        }
      }
    };

    socket.onclose = () => {
      setWs(null);
      setChatLog((prev) => `${prev}Disconnected from room.\n`);
    };
  };

  const handleSendMessage = () => {
    if (message.trim() === "" || !ws) return;
    ws.send(JSON.stringify({ message }));
    setChatLog((prev) => `${prev}You: ${message}\n`);
    setMessage("");
  };

  const handleBlockUser = (user: string) => {
    if (!blockedUsers.includes(user)) {
      setBlockedUsers([...blockedUsers, user]);
    }
  };

  const handleUnblockUser = (user: string) => {
    setBlockedUsers(blockedUsers.filter((blockedUser) => blockedUser !== user));
  };

  const handleDirectMessage = (user: string) => {
    if (blockedUsers.includes(user)) {
      alert("You have blocked this user.");
      return;
    }
    setDirectChat({ recipient: user, messages: [] });
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center">
      {!username ? (
        <form onSubmit={handleUsernameSubmit} className="card profile-card">
          <div className="card-header profile-header text-center">
            <h4 className="profile-title text-white">Enter Username</h4>
          </div>
          <div className="card-body">
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Username"
              value={username || ""}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-block">
              Enter
            </button>
          </div>
        </form>
      ) : ws ? (
        <div className="chat-container">
          <p>Logged in as: <strong>{username}</strong></p>
          <textarea
            value={chatLog}
            readOnly
            className="form-control mb-3"
            rows={10}
          ></textarea>
          <div className="d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={handleSendMessage} className="btn btn-primary">
              Send
            </button>
          </div>
          <div className="online-users mt-3">
            <h4>Online Users</h4>
            {onlineUsers.map((user) => (
              <div key={user} className="user-item">
                <span>{user}</span>
                <button onClick={() => handleBlockUser(user)} className="btn btn-danger btn-sm">
                  Block
                </button>
                <button onClick={() => handleDirectMessage(user)} className="btn btn-success btn-sm">
                  Message
                </button>
              </div>
            ))}
          </div>
          <div className="blocked-users mt-3">
            <h4>Blocked Users</h4>
            {blockedUsers.map((user) => (
              <div key={user} className="user-item">
                <span>{user}</span>
                <button
                  onClick={() => handleUnblockUser(user)}
                  className="btn btn-warning btn-sm"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
          {directChat.recipient && (
            <div className="direct-chat mt-3">
              <h4>Chat with {directChat.recipient}</h4>
              <textarea
                value={directChat.messages.join("\n")}
                readOnly
                className="form-control mb-3"
                rows={5}
              ></textarea>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleRoomJoin} className="card profile-card">
          <div className="card-header profile-header text-center">
            <h4 className="profile-title text-white">Join a Room</h4>
          </div>
          <div className="card-body">
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-block">
              Join
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatPage;
