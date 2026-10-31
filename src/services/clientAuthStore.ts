import { User } from '../types';

const USERS_STORAGE_KEY = 'documorph_registered_users';
const CURRENT_USER_KEY = 'documorph_current_user';

interface StoredUser extends User {
  password?: string;
}

const DEFAULT_USERS: StoredUser[] = [
  {
    _id: 'usr_admin_001',
    name: 'Sarah Chen (Platform Admin)',
    email: 'admin@documorph.io',
    password: 'Admin@123456',
    role: 'admin',
    plan: 'enterprise',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Chen',
    storageUsed: 12500000,
    conversionsCount: 42,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'usr_demo_002',
    name: 'Alex Vance',
    email: 'alex.vance@example.com',
    password: 'User@123456',
    role: 'user',
    plan: 'pro',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Vance',
    storageUsed: 4200000,
    conversionsCount: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'usr_demo_003',
    name: 'DocuMorph User',
    email: 'user@documorph.io',
    password: 'User@123456',
    role: 'user',
    plan: 'free',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DocuMorph%20User',
    storageUsed: 1500000,
    conversionsCount: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveStoredUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not save users to localStorage', e);
  }
}

export const clientAuthStore = {
  findUserByEmail(email: string): StoredUser | null {
    const users = getStoredUsers();
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  verifyCredentials(email: string, password: string): { user: User | null; message?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.findUserByEmail(normalizedEmail);

    if (!user) {
      return { user: null, message: 'No account found with this email. Please register.' };
    }

    if (user.password && user.password !== password) {
      return { user: null, message: 'Invalid password. Please check your credentials.' };
    }

    const { password: _, ...safeUser } = user;
    return { user: safeUser as User };
  },

  registerUser(data: { name: string; email: string; password: string }): { success: boolean; user?: User; token?: string; message?: string } {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = this.findUserByEmail(normalizedEmail);

    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please sign in.' };
    }

    const newUser: StoredUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role: 'user',
      plan: 'free',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name.trim())}`,
      storageUsed: 0,
      conversionsCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const users = getStoredUsers();
    users.push(newUser);
    saveStoredUsers(users);

    const token = `dcm_client_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const { password: _, ...safeUser } = newUser;

    this.setCurrentUser(safeUser as User, token);

    return {
      success: true,
      message: 'Registration successful! Welcome to DocuMorph.',
      user: safeUser as User,
      token,
    };
  },

  googleAuth(data: { email: string; name?: string; avatar?: string }): { success: boolean; user: User; token: string } {
    const normalizedEmail = data.email.trim().toLowerCase();
    let existing = this.findUserByEmail(normalizedEmail);

    if (!existing) {
      existing = {
        _id: `usr_g_${Date.now()}`,
        name: data.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'user',
        plan: 'free',
        avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || normalizedEmail)}`,
        storageUsed: 0,
        conversionsCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const users = getStoredUsers();
      users.push(existing);
      saveStoredUsers(users);
    }

    const token = `dcm_client_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const { password: _, ...safeUser } = existing;
    this.setCurrentUser(safeUser as User, token);

    return {
      success: true,
      user: safeUser as User,
      token,
    };
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User, token?: string) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem('documorph_token', token);
      }
    } catch (e) {
      console.warn('Could not save current user', e);
    }
  },

  updateCurrentUser(updates: Partial<User>): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const updated = { ...current, ...updates };
    this.setCurrentUser(updated);

    // Also update in stored users
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u._id === updated._id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      saveStoredUsers(users);
    }

    return updated;
  },

  clearSession() {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem('documorph_token');
    } catch {
      // Ignore
    }
  },
};
