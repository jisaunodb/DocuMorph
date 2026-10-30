import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { dataStore } from '../services/dataStore';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export function generateToken(payload: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in or create an account to process your documents.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;

    // Check if user is still active in dataStore / MongoDB
    const user = await dataStore.findUserByIdAsync(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive or has been suspended.',
        code: 'USER_INACTIVE',
      });
    }

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please sign in again.',
      code: 'TOKEN_INVALID',
    });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      req.user = decoded;
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrative privileges required.',
      code: 'FORBIDDEN',
    });
  }
  next();
}
