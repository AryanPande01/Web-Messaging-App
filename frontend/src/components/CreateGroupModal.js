import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiX } from 'react-icons/fi';
import '../styles/CreateGroupModal.css';

const CreateGroupModal = ({ onClose, onCreate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    groupImage: '',
    memberIds: []
  });
  const [selectedFriends, setSelectedFriends] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      memberIds: selectedFriends
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter group name"
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter group description"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Group Image URL (Optional)</label>
            <input
              type="text"
              name="groupImage"
              value={formData.groupImage}
              onChange={handleChange}
              placeholder="Enter image URL"
            />
          </div>
          <div className="form-group">
            <label>Select Members</label>
            <div className="friends-selector">
              {user?.friends?.length > 0 ? (
                user.friends.map((friend) => (
                  <div
                    key={friend._id}
                    className={`friend-select-item ${selectedFriends.includes(friend._id) ? 'selected' : ''}`}
                    onClick={() => toggleFriend(friend._id)}
                  >
                    <img
                      src={friend.profilePicture || 'https://via.placeholder.com/40'}
                      alt={friend.name}
                      className="friend-select-avatar"
                    />
                    <span>{friend.name}</span>
                  </div>
                ))
              ) : (
                <p className="no-friends">No friends to add</p>
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;

