import React, { useEffect, useRef } from 'react';
import '../../css/chat/MessageList.css';

interface Message {
  recipient: string;
  id: string;
  sender: string;
  message: string;
  isDM?: boolean;
  isAnnouncement?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  blockedUsers: string[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, blockedUsers }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter messages dynamically
  const filteredMessages = messages.filter(
    (msg) =>
      (!blockedUsers.includes(msg.sender) &&
      (!msg.isDM || msg.sender === currentUser || msg.recipient === currentUser))
  );

  return (
    <div className="list-container">
      {filteredMessages.map((msg) => {
        const isOwn = msg.sender === currentUser;
        const bubbleClass = isOwn ? 'message-own' : 'message-other';

        const senderText = msg.isDM
          ? `DM ${isOwn ? "to" : "from"} ${isOwn ? msg.recipient : msg.sender}`
          : msg.sender;

        return (
          <div key={msg.id} className="message-item-container">
            <div className={`message-bubble ${bubbleClass}`}>{msg.message}</div>
            <div className={isOwn ? 'sender-own' : 'sender-other'}>{senderText}</div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
