import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiSave } from 'react-icons/fi';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/users/profile', formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile</h2>
        <button
          className="profile-edit-button"
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? <><FiSave /> Save</> : <><FiEdit2 /> Edit</>}
        </button>
      </div>
      <div className="profile-content">
        <div className="profile-avatar-section">
          <img
            src={formData.profilePicture || 'https://via.placeholder.com/150'}
            alt={user?.name}
            className="profile-avatar"
          />
          {isEditing && (
            <input
              type="text"
              name="profilePicture"
              value={formData.profilePicture}
              onChange={handleChange}
              placeholder="Profile picture URL"
              className="profile-picture-input"
            />
          )}
        </div>
        <div className="profile-info">
          <div className="profile-field">
            <label>Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="profile-input"
              />
            ) : (
              <p className="profile-value">{user?.name}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Username</label>
            <p className="profile-value">@{user?.username}</p>
          </div>
          <div className="profile-field">
            <label>Email</label>
            <p className="profile-value">{user?.email}</p>
          </div>
          <div className="profile-field">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="profile-textarea"
                maxLength={150}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="profile-value">{user?.bio || 'No bio yet'}</p>
            )}
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{user?.friends?.length || 0}</span>
              <span className="stat-label">Friends</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

