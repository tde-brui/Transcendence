// src/components/Chat.js

import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from './OnlineUsers';
import Notifications from './Notifications';
import AnnouncementForm from './AnnouncementForm';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

const ChatContainer = styled.div`
  display: flex;
  flex: 1;
`;

const Sidebar = styled.div`
  width: 250px;
  border-right: 1px solid #ddd;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const MainChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

function Chat({ username, roomName }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    // Construct WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `ws://localhost:8000/ws/chat/${roomName}/?username=${username}`;
    
    ws.current = new WebSocket(wsUrl);
  
    ws.current.onopen = () => {
      console.log('WebSocket connected');
      addNotification('Connected to the chat server.');
    };
  
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      addNotification('Disconnected from the chat server.');
    };
  
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      handleMessage(data);
    };
  
    return () => {
      ws.current.close();
    };
    // eslint-disable-next-line
  }, []);  

  const handleMessage = (data) => {
    switch (data.type) {
      case 'chat':
        addMessage({ sender: data.sender, message: data.message });
        break;
      case 'direct':
        addMessage({ sender: `DM from ${data.sender}`, message: data.message });
        break;
      case 'update_users':
        setOnlineUsers(data.users);
        break;
      case 'error':
        addNotification(data.message);
        break;
      case 'block_success':
      case 'unblock_success':
        addNotification(data.message);
        break;
      case 'dm_sent':
        addNotification(data.message);
        break;
      case 'invite_game':
        addNotification(`Game invitation sent to '${data.target_user}'.`);
        window.open(data.url, '_blank');
        break;
      case 'announcement':
        addNotification(`Announcement: ${data.message}`);
        break;
      case 'view_profile':
        window.open(data.url, '_blank');
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, { id: uuidv4(), ...msg }]);
  };

  const addNotification = (note) => {
    const id = uuidv4();
    setNotifications((prev) => [...prev, { id, message: note }]);
    // Remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const sendMessage = (message) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const sendCommand = (command, target_user) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command, target_user }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const sendDirectMessage = (recipient, message) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ recipient, message }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const inviteToGame = (target_user) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ invite_game: true, target_user }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const sendAnnouncement = (announcement) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ announce: announcement }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const viewProfile = (target_user) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ view_profile: true, target_user }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  return (
    <>
      <Notifications notifications={notifications} />
      <ChatContainer>
        <Sidebar>
          <h3>Online Users</h3>
          <OnlineUsers
            users={onlineUsers}
            currentUser={username}
            sendDirectMessage={sendDirectMessage}
            blockUser={(action, user) => sendCommand(action, user)}
            inviteToGame={inviteToGame}
            viewProfile={viewProfile}
          />
          <h3>Announcements</h3>
          <AnnouncementForm sendAnnouncement={sendAnnouncement} />
        </Sidebar>
        <MainChat>
          <MessageList messages={messages} currentUser={username} />
          <MessageInput sendMessage={sendMessage} />
        </MainChat>
      </ChatContainer>
    </>
  );
}

export default Chat;
