import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  FiMessageSquare, 
  FiUsers, 
  FiSearch, 
  FiUser, 
  FiSettings, 
  FiBell,
  FiLogOut,
  FiUserPlus,
  FiGrid
} from 'react-icons/fi';
import api from '../utils/api';
import '../styles/Navbar.css';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    fetchPendingRequestsCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingRequestsCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update pending requests count when user changes
    fetchPendingRequestsCount();
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', () => {
        fetchUnreadCount();
      });
    }

    return () => {
      if (socket) {
        socket.off('newNotification');
      }
    };
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchPendingRequestsCount = async () => {
    try {
      if (user && user.friendRequestsReceived) {
          // Handle both populated and unpopulated arrays
          const count = Array.isArray(user.friendRequestsReceived) 
            ? user.friendRequestsReceived.length 
            : 0;
          setPendingRequestsCount(count);
      } else {
        setPendingRequestsCount(0);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequestsCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { id: 'chats', icon: FiMessageSquare, label: 'Chats' },
    { id: 'friends', icon: FiUsers, label: 'Friends' },
    { id: 'search', icon: FiSearch, label: 'Search' },
    { id: 'requests', icon: FiUserPlus, label: 'Requests', badge: pendingRequestsCount },
    { id: 'notifications', icon: FiBell, label: 'Notifications', badge: unreadCount },
    { id: 'groups', icon: FiGrid, label: 'Groups' },
    { id: 'profile', icon: FiUser, label: 'Profile' },
    { id: 'settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <h2 className="navbar-logo">Messenger</h2>
        <div className="navbar-user">
          <img 
            src={user?.profilePicture || 'https://via.placeholder.com/40'} 
            alt={user?.name}
            className="navbar-avatar"
          />
          <span className="navbar-username">{user?.name}</span>
        </div>
      </div>

      <div className="navbar-items">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              className={`navbar-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="navbar-icon" />
              <span className="navbar-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="navbar-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <button className="navbar-logout" onClick={handleLogout}>
        <FiLogOut className="navbar-icon" />
        <span className="navbar-label">Logout</span>
      </button>
    </nav>
  );
};

export default Navbar;

