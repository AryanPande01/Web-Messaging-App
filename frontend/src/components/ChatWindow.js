import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import '../styles/ChatWindow.css';

const ChatWindow = ({ chat, onBack, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const otherUser = chat?.user;
  const hasChat = Boolean(otherUser);


  const fetchMessages = useCallback(async () => {
    try {
      if (!otherUser || !otherUser._id) return;
      const response = await api.get(`/messages/chat/${otherUser._id}`);
      const fetchedMessages = response.data || [];
      const cleaned = fetchedMessages.filter(msg => !msg._id || !String(msg._id).startsWith('temp-'));
      cleaned.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(cleaned);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  }, [otherUser?._id]);

  const markAsSeen = useCallback(async () => {
    try {
      if (!otherUser || !otherUser._id) return;
      await api.put(`/messages/seen/${otherUser._id}`);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }, [otherUser?._id]);

  useEffect(() => {
    if (otherUser && otherUser._id) {
      fetchMessages();
      markAsSeen();
    }
  }, [otherUser?._id, fetchMessages, markAsSeen]);

  useEffect(() => {
    if (socket && otherUser && otherUser._id && user && user._id) {
      const handleNewMessage = (message) => {
        const receiverId = message.receiver?._id || message.receiver;
        const senderId = message.sender?._id || message.sender;
        const otherUserId = String(otherUser._id);
        const currentUserId = String(user._id);

        const isForThisChat = (
          (senderId && String(senderId) === otherUserId && receiverId && String(receiverId) === currentUserId) ||
          (senderId && String(senderId) === currentUserId && receiverId && String(receiverId) === otherUserId)
        );

        if (!isForThisChat) return;

        setMessages(prev => {
          // Replace temp optimistic message with server message when content & sender match
          const tempIndex = prev.findIndex(msg => msg._id && String(msg._id).startsWith('temp-') && msg.content === message.content && String(msg.sender?._id || msg.sender) === String(message.sender?._id || message.sender));
          if (tempIndex !== -1) {
            const newArr = [...prev];
            newArr[tempIndex] = message;
            // keep chronological order
            newArr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return newArr;
          }

          // Avoid duplicate ids
          if (prev.some(msg => msg._id && String(msg._id) === String(message._id))) return prev;
          const next = [...prev, message];
          next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return next;
        });

        markAsSeen();
        if (onMessageSent) onMessageSent();
      };

      const handleTyping = ({ senderId, isTyping: typing }) => {
        if (senderId && senderId.toString() === otherUser._id.toString()) {
          setTypingUser(typing ? otherUser : null);
        }
      };

      const handleMessageSeen = ({ messageId }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, status: 'seen' } : msg
          )
        );
      };

      const handleError = ({ message: errorMessage }) => {
        console.error('Socket error:', errorMessage);
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('typing', handleTyping);
      socket.on('messageSeen', handleMessageSeen);
      socket.on('error', handleError);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('typing', handleTyping);
        socket.off('messageSeen', handleMessageSeen);
        socket.off('error', handleError);
      };
    }
  }, [socket, otherUser?._id, user?._id, markAsSeen, onMessageSent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !otherUser || !otherUser._id) {
      return;
    }

    const messageContent = newMessage.trim();
    if (!messageContent) return;

    // Optimistically add message to UI (will be replaced by server response)
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, username: user.username, profilePicture: user.profilePicture },
      receiver: { _id: otherUser._id },
      content: messageContent,
      status: 'sent',
      createdAt: new Date()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    handleStopTyping();

    // Send to server
    try {
      socket.emit('sendMessage', {
        receiverId: otherUser._id.toString(),
        content: messageContent
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }

    // Server will replace temporary message via socket listener; do not remove it here
  };

  const handleTyping = () => {
    if (!socket || !otherUser || !otherUser._id) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { 
        receiverId: otherUser._id.toString(), 
        isTyping: true 
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (socket && isTyping && otherUser && otherUser._id) {
      setIsTyping(false);
      socket.emit('typing', { 
        receiverId: otherUser._id.toString(), 
        isTyping: false 
      });
    }
  };

  if (!hasChat) {
    return (
      <div className="chat-window">
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
          <p>Unable to load chat. Please select a conversation from the left.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <button className="chat-back-button" onClick={onBack}>
          <FiArrowLeft />
        </button>
        <img
          src={otherUser.profilePicture || 'https://via.placeholder.com/40'}
          alt={otherUser.name}
          className="chat-header-avatar"
        />
        <div className="chat-header-info">
          <span className="chat-header-name">{otherUser.name}</span>
          <span className="chat-header-status">
            {otherUser.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#64748b' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
            <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600, color: '#94a3b8' }}>No messages yet</p>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Start the conversation with {otherUser.name}!</p>
          </div>
        )}
        {messages.map((message, idx) => {
          if (!message || !message.content) return null;
          
          const senderId = message.sender?._id || message.sender;
          const currentUserId = user?._id?.toString();
          const isOwn = senderId && senderId.toString() === currentUserId;
          
          return (
            <div
              key={message._id || `msg-${idx}-${message.createdAt || ''}`}
              className={`chat-message ${isOwn ? 'own' : 'other'}`}
            >
              {!isOwn && message.sender && (
                <img
                  src={message.sender.profilePicture || 'https://via.placeholder.com/30'}
                  alt={message.sender.name || 'User'}
                  className="message-avatar"
                />
              )}
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {isOwn && (
                    <span className="message-status" title={message.status || 'sent'}>
                      {message.status === 'seen' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        {typingUser && (
          <div className="chat-message other typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onBlur={handleStopTyping}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">
          <FiSend />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

