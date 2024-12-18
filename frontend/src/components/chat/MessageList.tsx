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

  const blockedUsers: string[] = []; // Define blockedUsers as an empty array or fetch from a source

  const filteredMessages = messages.filter(
    (msg) => !blockedUsers.includes(msg.sender.replace('DM from ', '').replace('DM to ', ''))
  );
  
  return (
    <div className="list-container">
      {filteredMessages.map((msg) => {
        let isOwn = msg.sender === currentUser || msg.sender.includes("DM to");
        let bubbleClass = isOwn ? 'message-own' : 'message-other';
        if (msg.isAnnouncement) bubbleClass = 'message-announcement';
        if (msg.isDM && isOwn) bubbleClass = 'message-dm-own';
        if (msg.isDM && !isOwn) bubbleClass = 'message-dm-other';
  
        return (
          <div key={msg.id} className="message-item-container">
            <div className={`message-bubble ${bubbleClass}`}>{msg.message}</div>
            <div className={isOwn ? 'sender-own' : 'sender-other'}>{msg.sender}</div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );  
};

export default MessageList;
