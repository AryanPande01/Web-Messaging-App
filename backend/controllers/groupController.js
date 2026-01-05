const groupService = require('../services/groupService');

class GroupController {
  async createGroup(req, res) {
    try {
      const group = await groupService.createGroup(req.user._id, req.body);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getUserGroups(req, res) {
    try {
      const groups = await groupService.getUserGroups(req.user._id);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getGroupById(req, res) {
    try {
      const group = await groupService.getGroupById(req.params.groupId, req.user._id);
      res.json(group);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async addMembers(req, res) {
    try {
      const { memberIds } = req.body;
      const group = await groupService.addMembers(req.params.groupId, req.user._id, memberIds);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async removeMember(req, res) {
    try {
      const { memberId } = req.body;
      const group = await groupService.removeMember(req.params.groupId, req.user._id, memberId);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateGroup(req, res) {
    try {
      const group = await groupService.updateGroup(req.params.groupId, req.user._id, req.body);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new GroupController();

