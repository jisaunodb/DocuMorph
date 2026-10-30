import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

export const adminController = {
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const users = dataStore.getUsers();
      const files = dataStore.getFiles();
      const conversions = dataStore.getConversions();
      const logs = dataStore.getLogs();

      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.isActive).length;
      const totalFiles = files.length;
      const totalConversions = conversions.length;
      const successfulConversions = conversions.filter((c) => c.status === 'completed').length;
      const failedConversions = conversions.filter((c) => c.status === 'failed').length;

      const totalStorageBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

      // Tool usage breakdown
      const toolCountMap: Record<string, number> = {};
      for (const conv of conversions) {
        const type = conv.conversionType || conv.toolSlug || 'General';
        toolCountMap[type] = (toolCountMap[type] || 0) + 1;
      }

      const topTools = Object.entries(toolCountMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Storage by category
      const categoryMap: Record<string, number> = {};
      for (const f of files) {
        categoryMap[f.category] = (categoryMap[f.category] || 0) + (f.fileSize || 0);
      }

      return res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          totalFiles,
          totalConversions,
          successfulConversions,
          failedConversions,
          totalStorageBytes,
          topTools,
          categoryBreakdown: categoryMap,
          recentLogs: logs.slice(0, 10),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve admin stats.' });
    }
  },

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = dataStore.getUsers().map((u) => {
        const { password, ...safe } = u;
        return safe;
      });
      return res.json({ success: true, users });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to load users.' });
    }
  },

  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isActive, role, plan } = req.body;

      const updates: any = {};
      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      if (role !== undefined) updates.role = role;
      if (plan !== undefined) updates.plan = plan;

      const updated = await dataStore.updateUserAsync(id, updates);
      if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });

      const { password, ...safe } = updated;
      return res.json({ success: true, user: safe, message: 'User status updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (id === req.user?.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own administrative account.' });
      }

      dataStore.deleteUser(id);
      return res.json({ success: true, message: 'User deleted.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
  },

  async getAllFiles(req: AuthRequest, res: Response) {
    try {
      const files = dataStore.getFiles();
      return res.json({ success: true, files });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to load files.' });
    }
  },

  async getAllConversions(req: AuthRequest, res: Response) {
    try {
      const conversions = dataStore.getConversions();
      return res.json({ success: true, conversions });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to load conversions.' });
    }
  },

  async getActivityLogs(req: AuthRequest, res: Response) {
    try {
      const logs = dataStore.getLogs();
      return res.json({ success: true, logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to load logs.' });
    }
  },

  async getSettings(req: AuthRequest, res: Response) {
    try {
      const settings = dataStore.getSettings();
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to load settings.' });
    }
  },

  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const newSettings = req.body;
      const current = dataStore.getSettings();
      const updated = { ...current, ...newSettings };
      dataStore.saveSettings(updated);
      return res.json({ success: true, settings: updated, message: 'System settings saved.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to save settings.' });
    }
  },
};
