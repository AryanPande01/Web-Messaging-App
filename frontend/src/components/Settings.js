import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiMoon, FiSun, FiUnlock, FiUserX } from 'react-icons/fi';
import '../styles/Settings.css';

const Settings = () => {
  const { user, fetchUser } = useAuth();
  const [settings, setSettings] = useState({
    theme: user?.settings?.theme || 'dark',
    showLastSeen: user?.settings?.privacy?.showLastSeen ?? true,
    showReadReceipts: user?.settings?.privacy?.showReadReceipts ?? true
  });
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/users/blocked/list');
      setBlockedUsers(response.data.blockedUsers);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const handleThemeChange = async (theme) => {
    try {
      await api.put('/users/settings', { theme });
      setSettings(prev => ({ ...prev, theme }));
      fetchUser();
      toast.success('Theme updated!');
    } catch (error) {
      toast.error('Failed to update theme');
    }
  };

  const handlePrivacyChange = async (privacy) => {
    try {
      await api.put('/users/settings', { privacy });
      setSettings(prev => ({ ...prev, ...privacy }));
      fetchUser();
      toast.success('Privacy settings updated!');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post('/users/unblock', { userId });
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User unblocked');
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Theme</span>
              <span className="settings-option-desc">Choose your preferred theme</span>
            </div>
            <div className="theme-buttons">
              <button
                className={`theme-button ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <FiMoon /> Dark
              </button>
              <button
                className={`theme-button ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <FiSun /> Light
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Privacy</h3>
          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Show Last Seen</span>
              <span className="settings-option-desc">Let others see when you were last active</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showLastSeen}
                onChange={(e) => handlePrivacyChange({ showLastSeen: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Show Read Receipts</span>
              <span className="settings-option-desc">Let others know when you've read their messages</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showReadReceipts}
                onChange={(e) => handlePrivacyChange({ showReadReceipts: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Blocked Users</h3>
          <div className="blocked-users-list">
            {blockedUsers.length === 0 ? (
              <p className="empty-message">No blocked users</p>
            ) : (
              blockedUsers.map((blockedUser) => (
                <div key={blockedUser._id} className="blocked-user-item">
                  <img
                    src={blockedUser.profilePicture || 'https://via.placeholder.com/40'}
                    alt={blockedUser.name}
                    className="blocked-user-avatar"
                  />
                  <div className="blocked-user-info">
                    <span className="blocked-user-name">{blockedUser.name}</span>
                    <span className="blocked-user-username">@{blockedUser.username}</span>
                  </div>
                  <button
                    className="unblock-button"
                    onClick={() => handleUnblock(blockedUser._id)}
                  >
                    <FiUnlock /> Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

