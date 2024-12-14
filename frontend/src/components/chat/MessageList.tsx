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
      {/* <div className="message-list-header">
        Messages
      </div> */}
      {messages.map((msg) => {
        // Determine classes based on message properties
        const isOwn = msg.sender === currentUser;
        let bubbleClass = isOwn ? 'message-own' : 'message-other';
        let senderClass = isOwn ? 'sender-own' : 'sender-other';

        return (
          <div key={msg.id} className="message-item-container">
            {/* Text bubble for the message */}
            <div className={`message-bubble ${bubbleClass}`}>{msg.message}</div>
            {/* Sender below the text bubble */}
            <div className={`${senderClass}`}>{msg.sender}</div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
