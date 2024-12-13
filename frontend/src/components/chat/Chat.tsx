import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from './OnlineUsers';
import Notifications from './Notifications';
import AnnouncementForm from './AnnouncementForm';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import '../../css/chat/ChatPage.css';

interface Message {
  id: string;
  sender: string;
  message: string;
  isAnnouncement?: boolean;
  isDM?: boolean;
}

interface NotificationItem {
  id: string;
  message: string;
}

interface ChatProps {
  username: string;
}

const Chat: React.FC<ChatProps> = ({ username }) => {
  console.info("Chat.tsx: username: ", username);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://localhost:8000/ws/chat/?username=${username}`;
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
      ws.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  interface IncomingData {
    type: string;
    sender?: string;
    message?: string;
    users?: string[];
    target_user?: string;
    url?: string;
  }

  const handleMessage = (data: IncomingData) => {
    switch (data.type) {
      case 'chat':
        if (data.sender && data.message) {
          addMessage({ sender: data.sender, message: data.message, isAnnouncement: false });
        }
        break;
      case 'direct':
        if (data.sender && data.message) {
          addDMMessage(data.sender, data.message);
        }
        break;
      case 'update_users':
        if (data.users) {
          setOnlineUsers(data.users);
        }
        break;
      case 'error':
      case 'block_success':
      case 'unblock_success':
      case 'dm_sent':
        if (data.message) {
          addNotification(data.message);
        }
        break;
      case 'invite_game':
        if (data.target_user && data.url) {
          addNotification(`Game invitation sent to '${data.target_user}'.`);
          window.open(data.url, '_blank');
        }
        break;
      case 'announcement':
        if (data.sender && data.message) {
          addMessage({ sender: data.sender, message: data.message, isAnnouncement: true });
        }
        break;
      case 'view_profile':
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { id: uuidv4(), ...msg }]);
  };

  const addDMMessage = (sender: string, message: string) => {
    addMessage({ sender: `DM from ${sender}`, message, isDM: true });
    addNotification(`New DM from '${sender}'.`);
  };

  const addNotification = (note: string) => {
    const id = uuidv4();
    setNotifications((prev) => [...prev, { id, message: note }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const sendCommand = (command: string, target_user: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command, target_user }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const sendDirectMessage = (recipient: string, message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ recipient, message }));
      addMessage({ sender: `DM to ${recipient}`, message, isDM: true });
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const inviteToGame = (target_user: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ invite_game: true, target_user }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const sendAnnouncement = (announcement: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ announce: announcement }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  const viewProfile = (target_user: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ view_profile: true, target_user }));
    } else {
      addNotification('WebSocket is not connected.');
    }
  };

  return (
    <>
      <Notifications notifications={notifications} />
      <div className="chat-page-container container-fluid">
        {/* Sidebar */}
        <div className="sidebar-container">
          <div className="card profile-card mb-3 sidebar-card">
            <div className="profile-header">
              <h3 className="text-white">Online Users</h3>
            </div>
            <div className="card-body profile-body sidebar-body-scroll">
              <OnlineUsers
                users={onlineUsers}
                currentUser={username}
                sendDirectMessage={sendDirectMessage}
                blockUser={(action, user) => sendCommand(action, user)}
                inviteToGame={inviteToGame}
                viewProfile={viewProfile}
              />
            </div>
            <div className="profile-header">
              <h3 className="text-white">Server Announcements</h3>
            </div>
            <div className="card-body profile-footer">
              <AnnouncementForm sendAnnouncement={sendAnnouncement} />
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="main-chat-container ms-4">
          <div className="card main-chat-card">
            <div className="main-chat-messages">
              <MessageList messages={messages} currentUser={username} />
            </div>
            <div className="main-chat-input">
              <MessageInput sendMessage={sendMessage} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
