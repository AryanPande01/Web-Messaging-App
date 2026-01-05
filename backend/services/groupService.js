const Group = require('../models/Group');
const User = require('../models/User');
const Notification = require('../models/Notification');

class GroupService {
  async createGroup(userId, groupData) {
    const { name, description, groupImage, memberIds } = groupData;

    // Ensure creator is included in members
    const members = [...new Set([userId, ...memberIds])];

    const group = new Group({
      name,
      description,
      groupImage: groupImage || 'https://via.placeholder.com/150',
      admin: [userId],
      members,
      createdBy: userId
    });

    await group.save();
    await group.populate('members', 'name username profilePicture');
    await group.populate('admin', 'name username profilePicture');

    // Create notifications for members
    const notifications = members
      .filter(memberId => memberId.toString() !== userId.toString())
      .map(memberId => ({
        user: memberId,
        type: 'group_invite',
        from: userId,
        group: group._id,
        message: `You were added to the group "${name}"`,
        link: `/groups/${group._id}`
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return group;
  }

  async getUserGroups(userId) {
    const groups = await Group.find({
      members: userId
    })
    .populate('members', 'name username profilePicture isOnline')
    .populate('admin', 'name username profilePicture')
    .populate('createdBy', 'name username profilePicture')
    .sort({ updatedAt: -1 });

    return groups;
  }

  async getGroupById(groupId, userId) {
    const group = await Group.findById(groupId)
      .populate('members', 'name username profilePicture isOnline')
      .populate('admin', 'name username profilePicture')
      .populate('createdBy', 'name username profilePicture');

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is member
    const isMember = group.members.some(
      member => member._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error('Not a member of this group');
    }

    return group;
  }

  async addMembers(groupId, userId, memberIds) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is admin
    const isAdmin = group.admin.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isAdmin) {
      throw new Error('Only admins can add members');
    }

    // Add new members
    const newMembers = memberIds.filter(
      memberId => !group.members.some(
        mId => mId.toString() === memberId.toString()
      )
    );

    group.members.push(...newMembers);
    await group.save();

    // Create notifications
    const notifications = newMembers.map(memberId => ({
      user: memberId,
      type: 'group_invite',
      from: userId,
      group: group._id,
      message: `You were added to the group "${group.name}"`,
      link: `/groups/${group._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    await group.populate('members', 'name username profilePicture');
    return group;
  }

  async removeMember(groupId, userId, memberIdToRemove) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is admin
    const isAdmin = group.admin.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isAdmin) {
      throw new Error('Only admins can remove members');
    }

    // Cannot remove admin
    const isMemberAdmin = group.admin.some(
      adminId => adminId.toString() === memberIdToRemove.toString()
    );

    if (isMemberAdmin) {
      throw new Error('Cannot remove admin');
    }

    group.members = group.members.filter(
      mId => mId.toString() !== memberIdToRemove.toString()
    );

    await group.save();
    await group.populate('members', 'name username profilePicture');
    return group;
  }

  async updateGroup(groupId, userId, updateData) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is admin
    const isAdmin = group.admin.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isAdmin) {
      throw new Error('Only admins can update group');
    }

    Object.assign(group, updateData);
    await group.save();
    await group.populate('members', 'name username profilePicture');
    await group.populate('admin', 'name username profilePicture');

    return group;
  }
}

module.exports = new GroupService();

