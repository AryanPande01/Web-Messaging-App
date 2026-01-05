import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Chats from '../components/Chats';
import Friends from '../components/Friends';
import SearchUsers from '../components/SearchUsers';
import FriendRequests from '../components/FriendRequests';
import Notifications from '../components/Notifications';
import Groups from '../components/Groups';
import Profile from '../components/Profile';
import Settings from '../components/Settings';
import '../styles/Home.css';

const Home = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedFriendForChat, setSelectedFriendForChat] = useState(null);

  const handleFriendChatClick = (friend) => {
    setSelectedFriendForChat(friend);
    setActiveTab('chats');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chats':
        return <Chats initialFriend={selectedFriendForChat} onFriendSelected={() => setSelectedFriendForChat(null)} />;
      case 'friends':
        return <Friends onStartChat={handleFriendChatClick} />;
      case 'search':
        return <SearchUsers />;
      case 'requests':
        return <FriendRequests />;
      case 'notifications':
        return <Notifications />;
      case 'groups':
        return <Groups />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Chats />;
    }
  };

  return (
    <div className="home-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="home-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Home;

