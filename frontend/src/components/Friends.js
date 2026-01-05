import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiUser, FiMessageSquare } from 'react-icons/fi';
import '../styles/Friends.css';

const Friends = ({ onStartChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.friends) {
      setFriends(user.friends);
      setLoading(false);
    }
  }, [user]);

  const handleStartChat = (friend) => {
    if (onStartChat) {
      onStartChat(friend);
    }
  };

  if (loading) {
    return (
      <div className="friends-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Friends ({friends.length})</h2>
      </div>
      <div className="friends-list">
        {friends.length === 0 ? (
          <div className="friends-empty">
            <FiUser size={48} />
            <p>No friends yet. Search for users to add friends!</p>
          </div>
        ) : (
          friends.map((friend) => (
            <div key={friend._id} className="friend-item">
              <img
                src={friend.profilePicture || 'https://via.placeholder.com/60'}
                alt={friend.name}
                className="friend-avatar"
              />
              <div className="friend-info">
                <h3 className="friend-name">{friend.name}</h3>
                <p className="friend-username">@{friend.username}</p>
                <span className={`friend-status ${friend.isOnline ? 'online' : 'offline'}`}>
                  {friend.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                className="friend-chat-button"
                onClick={() => handleStartChat(friend)}
              >
                <FiMessageSquare />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Friends;

