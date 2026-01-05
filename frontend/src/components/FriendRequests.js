import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiCheck, FiX } from 'react-icons/fi';
import '../styles/FriendRequests.css';

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const authContext = useAuth();
  const { user, fetchUser, updateUser } = authContext;
  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      fetchRequestDetails();
    }
  }, [user?._id]); // Only re-fetch when user ID changes, not on every user update

  // Listen for real-time friend request updates
  useEffect(() => {
    if (socket) {
      const handleFriendRequestUpdate = () => {
        // Refresh user data first, then fetch request details
        fetchUser().then(() => {
          setTimeout(() => fetchRequestDetails(), 300);
        });
      };
      
      socket.on('friendRequestUpdate', handleFriendRequestUpdate);

      return () => {
        socket.off('friendRequestUpdate', handleFriendRequestUpdate);
      };
    }
  }, [socket]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    
    try {
      // Get fresh user data from API
      const userResponse = await api.get('/auth/me');
      const currentUser = userResponse.data.user;
      
      // Update user in context
      if (currentUser) {
        updateUser(currentUser);
      }
      
      if (!currentUser?.friendRequestsReceived?.length) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Handle both populated and unpopulated arrays
      const requestIds = currentUser.friendRequestsReceived.map(req => {
        // If already populated (object with _id), use _id, otherwise use the value directly
        return typeof req === 'object' && req._id ? req._id : req;
      });

      const requestsData = await Promise.all(
        requestIds.map(async (userId) => {
          try {
            const response = await api.get(`/users/${userId}`);
            return response.data;
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null values from failed requests
      setRequests(requestsData.filter(req => req !== null));
    } catch (error) {
      console.error('Error fetching request details:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await api.post('/friends/accept', { userId });
      toast.success('Friend request accepted!');
      // Refresh user data
      await fetchUser();
      // Remove from local state
      setRequests(prev => prev.filter(req => req._id !== userId));
      // Refresh the list
      setTimeout(() => {
        fetchRequestDetails();
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (userId) => {
    try {
      await api.post('/friends/decline', { userId });
      toast.success('Friend request declined');
      // Refresh user data
      await fetchUser();
      // Remove from local state
      setRequests(prev => prev.filter(req => req._id !== userId));
      // Refresh the list
      setTimeout(() => {
        fetchRequestDetails();
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline request');
    }
  };

  if (loading) {
    return (
      <div className="friend-requests-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="friend-requests-container">
      <div className="friend-requests-header">
        <h2>Friend Requests ({requests.length})</h2>
      </div>
      <div className="friend-requests-list">
        {requests.length === 0 ? (
          <div className="friend-requests-empty">
            <p>No pending friend requests</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request._id} className="friend-request-item">
              <img
                src={request.profilePicture || 'https://via.placeholder.com/60'}
                alt={request.name}
                className="request-avatar"
              />
              <div className="request-info">
                <h3 className="request-name">{request.name}</h3>
                <p className="request-username">@{request.username}</p>
              </div>
              <div className="request-actions">
                <button
                  className="request-accept"
                  onClick={() => handleAccept(request._id)}
                >
                  <FiCheck /> Accept
                </button>
                <button
                  className="request-decline"
                  onClick={() => handleDecline(request._id)}
                >
                  <FiX /> Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendRequests;

