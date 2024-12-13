// src/components/MessageList.tsx
import React, { useEffect, useRef } from 'react';
import '../../css/chat/MessageList.css';

interface Message {
  id: string;
  sender: string;
  message: string;
  isDM?: boolean;
  isAnnouncement?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="list-container">
      {messages.map((msg) => {
        // Determine classes based on message properties
        const isOwn = msg.sender === currentUser;
        let classNames = 'message-item message-item-container';
        classNames += isOwn ? ' message-own' : ' message-other';
        if (msg.isDM) classNames += ' message-dm';
        if (msg.isAnnouncement) classNames += ' message-announcement';

        return (
          <div key={msg.id} className={classNames}>
            <div className="sender">
              {msg.isAnnouncement ? `Announcement by ${msg.sender}` : msg.sender}
            </div>
            <div>{msg.message}</div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
