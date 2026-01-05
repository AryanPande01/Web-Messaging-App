import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiUserPlus, FiUsers } from 'react-icons/fi';
import '../styles/SearchUsers.css';

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, fetchUser } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery)}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Error searching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { userId });
      toast.success('Friend request sent!');
      // Refresh user data to update friend requests
      await fetchUser();
      // Refresh search results
      if (searchQuery.trim()) {
        const response = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery)}`);
        setUsers(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    }
  };

  const isFriend = (userId) => {
    if (!user?.friends) return false;
    return user.friends.some(friend => {
      const friendId = typeof friend === 'object' && friend._id ? friend._id : friend;
      return friendId.toString() === userId.toString();
    });
  };

  const hasRequestSent = (userId) => {
    if (!user?.friendRequestsSent) return false;
    return user.friendRequestsSent.some(id => {
      const requestId = typeof id === 'object' && id._id ? id._id : id;
      return requestId.toString() === userId.toString();
    });
  };

  const hasRequestReceived = (userId) => {
    if (!user?.friendRequestsReceived) return false;
    return user.friendRequestsReceived.some(id => {
      const requestId = typeof id === 'object' && id._id ? id._id : id;
      return requestId.toString() === userId.toString();
    });
  };

  const isCurrentUser = (userId) => {
    if (!user?._id) return false;
    return user._id.toString() === userId.toString();
  };

  return (
    <div className="search-users-container">
      <div className="search-users-header">
        <h2>Search Users</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="search-results">
        {users.length === 0 && searchQuery && !loading ? (
          <div className="search-empty">
            <p>No users found</p>
          </div>
        ) : (
          users.map((resultUser) => {
            if (isCurrentUser(resultUser._id)) return null;

            return (
              <div key={resultUser._id} className="search-result-item">
                <img
                  src={resultUser.profilePicture || 'https://via.placeholder.com/60'}
                  alt={resultUser.name}
                  className="result-avatar"
                />
                <div className="result-info">
                  <h3 className="result-name">{resultUser.name}</h3>
                  <p className="result-username">@{resultUser.username}</p>
                  {resultUser.mutualFriendsCount > 0 && (
                    <p className="result-mutual">
                      <FiUsers /> {resultUser.mutualFriendsCount} mutual friend{resultUser.mutualFriendsCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="result-actions">
                  {isFriend(resultUser._id) ? (
                    <span className="result-status">Friends</span>
                  ) : hasRequestSent(resultUser._id) ? (
                    <span className="result-status">Request Sent</span>
                  ) : hasRequestReceived(resultUser._id) ? (
                    <span className="result-status" style={{ color: '#667eea' }}>Request Received</span>
                  ) : (
                    <button
                      className="result-add-button"
                      onClick={() => handleSendRequest(resultUser._id)}
                    >
                      <FiUserPlus /> Add Friend
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SearchUsers;

