import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

export const conversionController = {
  async getMyConversions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const conversions = dataStore.getUserConversions(req.user.id);
      return res.json({
        success: true,
        conversions,
        total: conversions.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve conversion history.' });
    }
  },

  async deleteConversion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { id } = req.params;

      const conversions = dataStore.getConversions();
      const item = conversions.find((c) => c._id === id);
      if (!item) return res.status(404).json({ success: false, message: 'Conversion record not found.' });

      if (item.owner !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      dataStore.deleteConversion(id);
      return res.json({
        success: true,
        message: 'Conversion record removed.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete conversion.' });
    }
  },

  async clearHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const all = dataStore.getConversions();
      const filtered = all.filter((c) => c.owner !== req.user!.id);
      dataStore.saveConversions(filtered);

      return res.json({
        success: true,
        message: 'Conversion history cleared.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to clear history.' });
    }
  },
};
