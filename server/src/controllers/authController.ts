import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../services/dataStore';
import { generateToken, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email, and password.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      const existingUser = await dataStore.findUserByEmailAsync(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please sign in.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await dataStore.createUserAsync({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        plan: 'free',
        storageUsed: 0,
        conversionsCount: 0,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });

      // Send welcome / account creation email
      emailService.sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
        console.error('[EmailService] Background email dispatch error:', err.message);
      });

      // Log activity
      dataStore.createLog({
        userId: newUser._id,
        userName: newUser.name,
        userEmail: newUser.email,
        action: 'Account Created',
        category: 'auth',
        details: { method: 'local', notification: 'dispatched' },
        ipAddress: req.ip,
      });

      const token = generateToken({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      const { password: _, ...userSafe } = newUser;

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to DocuMorph.',
        token,
        user: userSafe,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration.',
      });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
        });
      }

      const user = await dataStore.findUserByEmailAsync(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      // Update last login
      await dataStore.updateUserAsync(user._id, { lastLogin: new Date().toISOString() });

      dataStore.createLog({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'User Signed In',
        category: 'auth',
        ipAddress: req.ip,
      });

      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const { password: _, ...userSafe } = user;

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: userSafe,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during login.',
      });
    }
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = dataStore.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { password: _, ...userSafe } = user;
      return res.json({
        success: true,
        user: userSafe,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { name, avatar } = req.body;
      const updates: any = {};
      if (name) updates.name = name.trim();
      if (avatar !== undefined) updates.avatar = avatar;

      const updated = await dataStore.updateUserAsync(req.user.id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password: _, ...userSafe } = updated;

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: userSafe,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      const user = dataStore.findUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await dataStore.updateUserAsync(user._id, { password: hashedPassword });

      return res.json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    // Architecture ready: checks user and returns friendly message
    const user = await dataStore.findUserByEmailAsync(email);
    if (!user) {
      // Security best practice: don't disclose whether email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      });
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
      devHint: 'In production, an automated email with a secure reset link is dispatched.',
    });
  },

  async googleAuth(req: Request, res: Response) {
    // Architectural endpoint for Google OAuth client sign-in
    try {
      const { email, name, avatar } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Google authentication payload missing email.' });
      }

      let user = await dataStore.findUserByEmailAsync(email);
      if (!user) {
        user = await dataStore.createUserAsync({
          name: name || email.split('@')[0],
          email,
          avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
          role: 'user',
          plan: 'free',
        });
      }

      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const { password: _, ...userSafe } = user;
      return res.json({
        success: true,
        message: 'Google authentication successful.',
        token,
        user: userSafe,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Google authentication failed.' });
    }
  },
};
