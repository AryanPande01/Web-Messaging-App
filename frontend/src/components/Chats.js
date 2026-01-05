import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ChatWindow from './ChatWindow';
import '../styles/Chats.css';

const Chats = ({ initialFriend, onFriendSelected }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
  }, []);

  // Handle initial friend selection (when coming from Friends tab)
  useEffect(() => {
    if (initialFriend && initialFriend._id && !loading) {
      // Find chat in existing chats
      const chat = chats.find(c => {
        const chatUserId = c.user?._id || c.user;
        const friendId = initialFriend._id;
        return chatUserId && friendId && chatUserId.toString() === friendId.toString();
      });
      
      if (chat) {
        setSelectedChat(chat);
      } else {
        // Create a chat object for friend even if no messages exist
        const newChat = {
          user: initialFriend,
          lastMessage: null,
          unreadCount: 0
        };
        setSelectedChat(newChat);
      }
      
      if (onFriendSelected) {
        onFriendSelected();
      }
    }
  }, [initialFriend, chats, loading]);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        fetchChats(); // Refresh chat list when new message arrives
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
      }
    };
  }, [socket]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/messages/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="chats-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (selectedChat && selectedChat.user) {
    return (
      <ChatWindow 
        chat={selectedChat} 
        onBack={() => {
          setSelectedChat(null);
          fetchChats(); // Refresh chat list when going back
        }}
        onMessageSent={fetchChats}
      />
    );
  }

  return (
    <div className="chats-container">
      <div className="chats-header">
        <h2>Chats</h2>
      </div>
      <div className="chats-list">
        {chats.length === 0 ? (
          <div className="chats-empty">
            <p>No chats yet. Start a conversation with a friend!</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.user._id}
              className="chat-item"
              onClick={() => setSelectedChat(chat)}
            >
              <img
                src={chat.user.profilePicture || 'https://via.placeholder.com/50'}
                alt={chat.user.name}
                className="chat-avatar"
              />
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name">{chat.user.name}</span>
                  {chat.lastMessage && (
                    <span className="chat-time">
                      {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                <div className="chat-preview">
                  {chat.lastMessage ? (
                    <>
                      <span className="chat-message">
                        {chat.lastMessage.sender._id === user._id ? 'You: ' : ''}
                        {chat.lastMessage.content}
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="chat-unread">{chat.unreadCount}</span>
                      )}
                    </>
                  ) : (
                    <span className="chat-message" style={{ fontStyle: 'italic', color: '#666' }}>
                      No messages yet. Start the conversation!
                    </span>
                  )}
                </div>
              </div>
              {chat.user.isOnline && <div className="chat-online"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Chats;

