// This will be set by server.js
let ioInstance = null;
let onlineUsersMap = null;

const setIO = (io, onlineUsers) => {
  ioInstance = io;
  onlineUsersMap = onlineUsers;
};

const emitToUser = (userId, event, data) => {
  if (!ioInstance || !onlineUsersMap) return;
  
  try {
    const socketId = onlineUsersMap.get(userId.toString());
    if (socketId) {
      ioInstance.to(socketId).emit(event, data);
    }
  } catch (error) {
    console.error('Error emitting socket event:', error);
  }
};

module.exports = {
  setIO,
  emitToUser
};

