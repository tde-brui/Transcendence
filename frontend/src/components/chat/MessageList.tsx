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
        let isOwn = msg.sender === currentUser;
		if (msg.isDM)
		{
			if (msg.sender.includes("DM to"))
				isOwn = true;
			else
				isOwn = false;
		}
        let bubbleClass = isOwn ? 'message-own' : 'message-other';
		if (msg.isAnnouncement) { bubbleClass = 'message-announcement'; }
		if (msg.isDM && isOwn) { bubbleClass = 'message-dm-own'; }
		if (msg.isDM && !isOwn) { bubbleClass = 'message-dm-other'; }
        let senderClass = isOwn ? 'sender-own' : 'sender-other';

        return (
          <div key={msg.id} className="message-item-container">
            <div className={`message-bubble ${bubbleClass}`}>{msg.message}</div>
            <div className={`${senderClass}`}>{msg.sender}</div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
