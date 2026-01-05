const User = require('../models/User');
const Notification = require('../models/Notification');

class FriendService {
  async searchUsers(query, currentUserId) {
    const mongoose = require('mongoose');
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Convert currentUserId to ObjectId if it's a string
    const currentUserIdObj = mongoose.Types.ObjectId.isValid(currentUserId) 
      ? new mongoose.Types.ObjectId(currentUserId) 
      : currentUserId;

    // Convert blocked users to ObjectIds
    const blockedUserIds = currentUser.blockedUsers.map(id => 
      mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
    );

    // Search users by name, username, or email (excluding blocked users and current user)
    const users = await User.find({
      _id: { $ne: currentUserIdObj, $nin: blockedUserIds },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name username email profilePicture friends bio _id')
    .limit(20);

    // Calculate mutual friends for each user
    const usersWithMutualFriends = users.map(user => {
      const mutualFriends = user.friends.filter(friendId => 
        currentUser.friends.some(fId => fId.toString() === friendId.toString())
      );
      
      return {
        ...user.toObject(),
        mutualFriendsCount: mutualFriends.length,
        mutualFriends: mutualFriends.slice(0, 5) // Limit to 5 for display
      };
    });

    return usersWithMutualFriends;
  }

  async sendFriendRequest(fromUserId, toUserId) {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      throw new Error('User not found');
    }

    // Check if already friends
    if (fromUser.friends.includes(toUserId)) {
      throw new Error('Already friends');
    }

    // Check if request already sent
    if (fromUser.friendRequestsSent.includes(toUserId)) {
      throw new Error('Friend request already sent');
    }

    // Check if request already received
    if (fromUser.friendRequestsReceived.includes(toUserId)) {
      throw new Error('Friend request already received from this user');
    }

    // Check if blocked
    if (fromUser.blockedUsers.includes(toUserId) || toUser.blockedUsers.includes(fromUserId)) {
      throw new Error('Cannot send friend request to blocked user');
    }

    // Add to sent requests
    fromUser.friendRequestsSent.push(toUserId);
    await fromUser.save();

    // Add to received requests
    toUser.friendRequestsReceived.push(fromUserId);
    await toUser.save();

    // Create notification
    const notification = new Notification({
      user: toUserId,
      type: 'friend_request',
      from: fromUserId,
      message: `${fromUser.name} sent you a friend request`,
      link: '/friends/requests'
    });
    await notification.save();

    // Return data needed for real-time updates
    return { 
      message: 'Friend request sent successfully',
      fromUser: fromUser._id,
      toUser: toUser._id
    };
  }

  async acceptFriendRequest(userId, requestUserId) {
    const user = await User.findById(userId);
    const requestUser = await User.findById(requestUserId);

    if (!user || !requestUser) {
      throw new Error('User not found');
    }

    // Check if request exists
    if (!user.friendRequestsReceived.includes(requestUserId)) {
      throw new Error('Friend request not found');
    }

    // Remove from requests
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      id => id.toString() !== requestUserId.toString()
    );
    requestUser.friendRequestsSent = requestUser.friendRequestsSent.filter(
      id => id.toString() !== userId.toString()
    );

    // Add to friends
    if (!user.friends.includes(requestUserId)) {
      user.friends.push(requestUserId);
    }
    if (!requestUser.friends.includes(userId)) {
      requestUser.friends.push(userId);
    }

    await user.save();
    await requestUser.save();

    // Create notification for requester
    const notification = new Notification({
      user: requestUserId,
      type: 'friend_accepted',
      from: userId,
      message: `${user.name} accepted your friend request`,
      link: '/chats'
    });
    await notification.save();

    return { message: 'Friend request accepted' };
  }

  async declineFriendRequest(userId, requestUserId) {
    const user = await User.findById(userId);
    const requestUser = await User.findById(requestUserId);

    if (!user || !requestUser) {
      throw new Error('User not found');
    }

    // Remove from requests
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      id => id.toString() !== requestUserId.toString()
    );
    requestUser.friendRequestsSent = requestUser.friendRequestsSent.filter(
      id => id.toString() !== userId.toString()
    );

    await user.save();
    await requestUser.save();

    // Create notification for requester
    const notification = new Notification({
      user: requestUserId,
      type: 'friend_declined',
      from: userId,
      message: `${user.name} declined your friend request`
    });
    await notification.save();

    return { message: 'Friend request declined' };
  }

  async getSuggestedUsers(userId) {
    const user = await User.findById(userId).populate('friends');
    if (!user) {
      throw new Error('User not found');
    }

    const friendIds = user.friends.map(f => f._id);
    const blockedIds = [...user.blockedUsers, userId];

    // Get users with mutual friends
    const suggestedUsers = await User.find({
      _id: { $nin: [...friendIds, ...blockedIds] },
      friends: { $in: friendIds }
    })
    .select('name username email profilePicture friends')
    .limit(10);

    // Calculate mutual friends count
    const usersWithMutualFriends = suggestedUsers.map(suggestedUser => {
      const mutualFriends = suggestedUser.friends.filter(friendId =>
        friendIds.some(fId => fId.toString() === friendId.toString())
      );
      return {
        ...suggestedUser.toObject(),
        mutualFriendsCount: mutualFriends.length
      };
    });

    // Sort by mutual friends count
    usersWithMutualFriends.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);

    return usersWithMutualFriends;
  }
}

module.exports = new FriendService();

