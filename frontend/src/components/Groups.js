import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiUsers } from 'react-icons/fi';
import CreateGroupModal from './CreateGroupModal';
import GroupChat from './GroupChat';
import '../styles/Groups.css';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const response = await api.post('/groups', groupData);
      setGroups(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      toast.success('Group created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    }
  };

  if (selectedGroup) {
    return (
      <GroupChat
        group={selectedGroup}
        onBack={() => {
          setSelectedGroup(null);
          fetchGroups();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="groups-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h2>Groups</h2>
        <button
          className="create-group-button"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus /> Create Group
        </button>
      </div>
      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="groups-empty">
            <FiUsers size={48} />
            <p>No groups yet. Create your first group!</p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group._id}
              className="group-item"
              onClick={() => setSelectedGroup(group)}
            >
              <img
                src={group.groupImage || 'https://via.placeholder.com/60'}
                alt={group.name}
                className="group-avatar"
              />
              <div className="group-info">
                <h3 className="group-name">{group.name}</h3>
                <p className="group-members">
                  {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default Groups;

