// src/components/ChatPage.tsx

import React, { useState, useEffect } from 'react';
import Chat from '../components/chat/Chat';
import styled from 'styled-components';
import axiosInstance from '../components/utils/AxiosInstance';
import SpinningLogo from '../components/SpinningLogo';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;

  input {
    margin: 5px;
    padding: 10px;
    width: 200px;
  }

  button {
    padding: 10px 20px;
    margin-top: 10px;
    cursor: pointer;
  }
`;

interface ChatPageProps {
	userId: number;
}

const ChatPage: React.FC<ChatPageProps> = ({ userId }) => {
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}/`);
        if (response.status === 200 && response.data) 
			setUsername(response.data.username);
			setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    fetchUser();
  }, [userId]);

  if (username === '' || !isConnected)
	return (<SpinningLogo />);

  return (
    <AppContainer>
      <Chat username={username} />
    </AppContainer>
  );
};

export default ChatPage;
