import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import '../styles/GroupChat.css';

const GroupChat = ({ group, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!group || !group._id) return;
    fetchMessages();
  }, [group?._id]);

  useEffect(() => {
    if (!socket || !group || !group._id) return;

    const handleNewGroupMessage = (message) => {
      const messageGroupId = String(message.group?._id || message.group);
      const currentGroupId = String(group._id);
      if (messageGroupId !== currentGroupId) return;

      setMessages(prev => {
        // Replace temp message if content & sender match
        const tempIndex = prev.findIndex(m => m._id && String(m._id).startsWith('temp-') && m.content === message.content && String(m.sender?._id || m.sender) === String(message.sender?._id || message.sender));
        if (tempIndex !== -1) {
          const newArr = [...prev];
          newArr[tempIndex] = message;
          newArr.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
          return newArr;
        }
        // Avoid duplicate id
        if (prev.some(m => m._id && String(m._id) === String(message._id))) return prev;
        const next = [...prev, message];
        next.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        return next;
      });
    };

    socket.on('newMessage', handleNewGroupMessage);

    return () => {
      socket.off('newMessage', handleNewGroupMessage);
    };
  }, [socket, group?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/messages/group/${group._id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !group || !group._id) return;

    const messageContent = newMessage.trim();

    // Optimistic UI: add temp message
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, profilePicture: user.profilePicture },
      group: { _id: group._id },
      content: messageContent,
      createdAt: new Date(),
      status: 'sent'
    };

    setMessages(prev => {
      const next = [...prev, tempMessage];
      next.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      return next;
    });

    // Send to server
    try {
      socket.emit('sendMessage', {
        groupId: group._id,
        content: messageContent
      });
    } catch (err) {
      console.error('Error sending group message:', err);
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
    }

    setNewMessage('');
  };

  return (
    <div className="group-chat">
      <div className="group-chat-header">
        <button className="group-back-button" onClick={onBack}>
          <FiArrowLeft />
        </button>
        <img
          src={group.groupImage || 'https://via.placeholder.com/40'}
          alt={group.name}
          className="group-header-avatar"
        />
        <div className="group-header-info">
          <span className="group-header-name">{group.name}</span>
          <span className="group-header-members">
            {group.members?.length || 0} members
          </span>
        </div>
      </div>

      <div className="group-messages">
        {messages.map((message) => {
          const senderId = String(message.sender?._id || message.sender || '');
          const isOwn = senderId === String(user?._id || '');
          return (
            <div
              key={message._id || `msg-${message.createdAt || ''}`}
              className={`group-message ${isOwn ? 'own' : 'other'}`}
            >
              {!isOwn && message.sender && (
                <img
                  src={message.sender.profilePicture || 'https://via.placeholder.com/30'}
                  alt={message.sender.name || 'User'}
                  className="group-message-avatar"
                />
              )}
              <div className="group-message-content">
                {!isOwn && message.sender && (
                  <span className="group-message-sender">{message.sender.name || 'User'}</span>
                )}
                <p>{message.content}</p>
                <span className="group-message-time">
                  {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="group-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="group-input"
        />
        <button type="submit" className="group-send-button">
          <FiSend />
        </button>
      </form>
    </div>
  );
};

export default GroupChat;

