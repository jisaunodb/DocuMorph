import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { FileModel } from '../models/FileModel';
import { ConversionModel } from '../models/Conversion';
import { ActivityLogModel, SystemSettingModel } from '../models/ActivityLog';
import { PaymentModel, IPayment } from '../models/Payment';

// Local resilient storage folder: On Vercel / serverless, process.cwd() is read-only, so use os.tmpdir()
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'documorph_data')
  : path.join(process.cwd(), 'uploads', 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
const CONVERSIONS_FILE = path.join(DATA_DIR, 'conversions.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

const memoryCache = new Map<string, any>();

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // In serverless, folder creation may be constrained, memoryCache acts as fallback
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      if (memoryCache.has(filePath)) {
        return memoryCache.get(filePath);
      }
      try {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      } catch {
        // Fallback to memory
      }
      memoryCache.set(filePath, defaultValue);
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    memoryCache.set(filePath, parsed);
    return parsed;
  } catch {
    if (memoryCache.has(filePath)) {
      return memoryCache.get(filePath);
    }
    memoryCache.set(filePath, defaultValue);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  memoryCache.set(filePath, data);
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch {
    // In-memory cache already holds the latest state, preventing any serverless EROFS crash
  }
}

// Default Admin and Demo Users
const defaultAdminPasswordHash = bcrypt.hashSync('Admin@123456', 10);
const defaultUserPasswordHash = bcrypt.hashSync('User@123456', 10);

const INITIAL_USERS = [
  {
    _id: 'admin_usr_001',
    name: 'Sarah Chen (Platform Admin)',
    email: 'admin@documorph.io',
    password: defaultAdminPasswordHash,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    storageUsed: 24500000,
    plan: 'enterprise',
    conversionsCount: 42,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date('2026-01-15T08:00:00.000Z').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'demo_usr_002',
    name: 'Alex Vance (Pro Designer)',
    email: 'alex.vance@example.com',
    password: defaultUserPasswordHash,
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    storageUsed: 12800000,
    plan: 'pro',
    conversionsCount: 19,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date('2026-02-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_FILES = [
  {
    _id: 'file_001',
    originalName: 'Quarterly_Financial_Report_Q4.pdf',
    currentName: 'Quarterly_Financial_Report_Q4.pdf',
    fileType: 'pdf',
    mimeType: 'application/pdf',
    fileSize: 2480000,
    localPath: '',
    cloudinaryUrl: '',
    owner: 'admin_usr_001',
    processingStatus: 'completed',
    isFavorite: true,
    category: 'pdf',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    _id: 'file_002',
    originalName: 'Project_Contract_Draft_v2.docx',
    currentName: 'Project_Contract_Draft_v2.docx',
    fileType: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 854000,
    localPath: '',
    cloudinaryUrl: '',
    owner: 'admin_usr_001',
    processingStatus: 'ready',
    isFavorite: false,
    category: 'document',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    _id: 'file_003',
    originalName: 'Scanned_Invoice_Receipt.jpg',
    currentName: 'Scanned_Invoice_Receipt.jpg',
    fileType: 'jpg',
    mimeType: 'image/jpeg',
    fileSize: 1420000,
    localPath: '',
    cloudinaryUrl: '',
    owner: 'demo_usr_002',
    processingStatus: 'ready',
    isFavorite: false,
    category: 'image',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const INITIAL_CONVERSIONS = [
  {
    _id: 'conv_001',
    originalFileId: 'file_001',
    originalFileName: 'Quarterly_Financial_Report_Q4.pdf',
    originalFileSize: 4890000,
    outputFileName: 'Quarterly_Financial_Report_Q4_compressed.pdf',
    outputFileSize: 1950000,
    outputDownloadUrl: '/api/conversions/sample-download',
    conversionType: 'Compress PDF',
    toolSlug: 'compress-pdf',
    status: 'completed',
    owner: 'admin_usr_001',
    processingTimeMs: 1420,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    _id: 'conv_002',
    originalFileId: 'file_003',
    originalFileName: 'Receipt_Batch_April.zip',
    originalFileSize: 3200000,
    outputFileName: 'Receipt_Batch_April_Merged.pdf',
    outputFileSize: 2800000,
    outputDownloadUrl: '/api/conversions/sample-download',
    conversionType: 'Image to PDF',
    toolSlug: 'image-to-pdf',
    status: 'completed',
    owner: 'admin_usr_001',
    processingTimeMs: 2100,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

const INITIAL_LOGS = [
  {
    _id: 'log_001',
    userId: 'admin_usr_001',
    userName: 'Sarah Chen (Platform Admin)',
    userEmail: 'admin@documorph.io',
    action: 'User Authentication Success',
    category: 'auth',
    details: { method: 'password', role: 'admin' },
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'log_002',
    userId: 'admin_usr_001',
    userName: 'Sarah Chen (Platform Admin)',
    userEmail: 'admin@documorph.io',
    action: 'Executed Compress PDF Operation',
    category: 'tool',
    details: { tool: 'compress-pdf', outputSize: 1950000 },
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const INITIAL_SETTINGS = {
  siteName: 'DocuMorph',
  maxFileSizeMb: 50,
  enableGuestConversions: false,
  maintenanceMode: false,
  allowRegistrations: true,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
};

export const dataStore = {
  /**
   * Initializes MongoDB collections, seeding initial records if empty,
   * and loading any existing records into memory cache for lightning-fast reads.
   */
  async initMongoDB() {
    if (mongoose.connection.readyState !== 1) {
      console.log('[dataStore] Mongoose not connected. Using local JSON store.');
      return;
    }

    try {
      console.log('[dataStore] Initializing collections & sync with MongoDB Atlas...');

      // 1. Users sync
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('[dataStore] Seeding initial users into MongoDB Atlas...');
        for (const u of INITIAL_USERS) {
          await UserModel.findOneAndUpdate(
            { email: u.email },
            u,
            { upsert: true, returnDocument: 'after' }
          );
        }
      }
      const mongoUsers = await UserModel.find().lean();
      if (mongoUsers.length > 0) {
        writeJsonFile(USERS_FILE, mongoUsers);
      }

      // 2. Files sync
      const fileCount = await FileModel.countDocuments();
      if (fileCount === 0) {
        console.log('[dataStore] Seeding initial files into MongoDB Atlas...');
        for (const f of INITIAL_FILES) {
          await FileModel.findOneAndUpdate(
            { _id: f._id },
            f,
            { upsert: true, returnDocument: 'after' }
          );
        }
      }
      const mongoFiles = await FileModel.find().lean();
      if (mongoFiles.length > 0) {
        writeJsonFile(FILES_FILE, mongoFiles);
      }

      // 3. Conversions sync
      const convCount = await ConversionModel.countDocuments();
      if (convCount === 0) {
        console.log('[dataStore] Seeding initial conversions into MongoDB Atlas...');
        for (const c of INITIAL_CONVERSIONS) {
          await ConversionModel.findOneAndUpdate(
            { _id: c._id },
            c,
            { upsert: true, returnDocument: 'after' }
          );
        }
      }
      const mongoConvs = await ConversionModel.find().lean();
      if (mongoConvs.length > 0) {
        writeJsonFile(CONVERSIONS_FILE, mongoConvs);
      }

      // 4. Logs sync
      const logCount = await ActivityLogModel.countDocuments();
      if (logCount === 0) {
        for (const l of INITIAL_LOGS) {
          await ActivityLogModel.findOneAndUpdate(
            { _id: l._id },
            l,
            { upsert: true, returnDocument: 'after' }
          );
        }
      }
      const mongoLogs = await ActivityLogModel.find().sort({ createdAt: -1 }).limit(100).lean();
      if (mongoLogs.length > 0) {
        writeJsonFile(LOGS_FILE, mongoLogs);
      }

      // 5. Settings sync
      const settingDoc = await SystemSettingModel.findOne({ key: 'general_settings' }).lean();
      if (!settingDoc) {
        await SystemSettingModel.findOneAndUpdate(
          { key: 'general_settings' },
          {
            _id: 'setting_general_001',
            key: 'general_settings',
            value: INITIAL_SETTINGS,
            description: 'Core platform configuration',
          },
          { upsert: true, returnDocument: 'after' }
        );
      } else if (settingDoc.value) {
        writeJsonFile(SETTINGS_FILE, settingDoc.value);
      }

      console.log(`[dataStore] Successfully synced with MongoDB Atlas (Users: ${mongoUsers.length || userCount}, Files: ${mongoFiles.length || fileCount}).`);
    } catch (err: any) {
      console.error('[dataStore] Error initializing MongoDB sync:', err.message);
    }
  },

  // ================= USERS =================
  getUsers: () => readJsonFile<any[]>(USERS_FILE, INITIAL_USERS),
  saveUsers: (users: any[]) => writeJsonFile(USERS_FILE, users),

  findUserById: (id: string) => {
    const users = dataStore.getUsers();
    return users.find((u) => u._id === id);
  },

  async findUserByIdAsync(id: string) {
    if (mongoose.connection.readyState === 1) {
      try {
        const u = await UserModel.findById(id).lean();
        if (u) return u;
      } catch {}
    }
    return dataStore.findUserById(id);
  },

  findUserByEmail: (email: string) => {
    const users = dataStore.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async findUserByEmailAsync(email: string) {
    if (mongoose.connection.readyState === 1) {
      try {
        const u = await UserModel.findOne({ email: email.toLowerCase() }).lean();
        if (u) return u;
      } catch {}
    }
    return dataStore.findUserByEmail(email);
  },

  createUser: (userData: any) => {
    const users = dataStore.getUsers();
    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      storageUsed: 0,
      plan: 'free',
      conversionsCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData,
    };
    users.push(newUser);
    dataStore.saveUsers(users);

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      UserModel.findOneAndUpdate(
        { email: newUser.email.toLowerCase() },
        newUser,
        { upsert: true, returnDocument: 'after' }
      ).catch((err) => console.error('[MongoDB] UserModel save error:', err.message));
    }

    return newUser;
  },

  async createUserAsync(userData: any) {
    const users = dataStore.getUsers();
    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      storageUsed: 0,
      plan: 'free',
      conversionsCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData,
    };
    users.push(newUser);
    dataStore.saveUsers(users);

    if (mongoose.connection.readyState === 1) {
      try {
        await UserModel.findOneAndUpdate(
          { email: newUser.email.toLowerCase() },
          newUser,
          { upsert: true, returnDocument: 'after' }
        );
      } catch (err: any) {
        console.error('[MongoDB] UserModel.create error:', err.message);
      }
    }
    return newUser;
  },

  updateUser: (id: string, updates: any) => {
    const users = dataStore.getUsers();
    const idx = users.findIndex((u) => u._id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    dataStore.saveUsers(users);

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      UserModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' })
        .catch((err) => console.error('[MongoDB] UserModel update error:', err.message));
    }

    return users[idx];
  },

  async updateUserAsync(id: string, updates: any) {
    const res = dataStore.updateUser(id, updates);
    if (mongoose.connection.readyState === 1) {
      try {
        await UserModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' });
      } catch (err: any) {
        console.error('[MongoDB] updateUserAsync error:', err.message);
      }
    }
    return res;
  },

  deleteUser: (id: string) => {
    let users = dataStore.getUsers();
    users = users.filter((u) => u._id !== id);
    dataStore.saveUsers(users);

    if (mongoose.connection.readyState === 1) {
      UserModel.findByIdAndDelete(id).catch((err) => console.error('[MongoDB] UserModel delete error:', err.message));
    }
    return true;
  },

  // ================= FILES =================
  getFiles: () => readJsonFile<any[]>(FILES_FILE, INITIAL_FILES),
  saveFiles: (files: any[]) => writeJsonFile(FILES_FILE, files),

  getUserFiles: (userId: string) => {
    const files = dataStore.getFiles();
    return files.filter((f) => f.owner === userId);
  },

  async getUserFilesAsync(userId: string) {
    if (mongoose.connection.readyState === 1) {
      try {
        const files = await FileModel.find({ owner: userId }).sort({ createdAt: -1 }).lean();
        if (files && files.length > 0) return files;
      } catch {}
    }
    return dataStore.getUserFiles(userId);
  },

  findFileById: (id: string) => {
    const files = dataStore.getFiles();
    return files.find((f) => f._id === id);
  },

  createFile: (fileData: any) => {
    const files = dataStore.getFiles();
    const newFile = {
      _id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      processingStatus: 'ready',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...fileData,
    };
    files.unshift(newFile);
    dataStore.saveFiles(files);

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      FileModel.findOneAndUpdate(
        { _id: newFile._id },
        newFile,
        { upsert: true, returnDocument: 'after' }
      ).catch((err) => console.error('[MongoDB] FileModel save error:', err.message));
    }

    return newFile;
  },

  async createFileAsync(fileData: any) {
    const newFile = dataStore.createFile(fileData);
    if (mongoose.connection.readyState === 1) {
      try {
        await FileModel.findOneAndUpdate(
          { _id: newFile._id },
          newFile,
          { upsert: true, returnDocument: 'after' }
        );
      } catch (err: any) {
        console.error('[MongoDB] createFileAsync error:', err.message);
      }
    }
    return newFile;
  },

  updateFile: (id: string, updates: any) => {
    const files = dataStore.getFiles();
    const idx = files.findIndex((f) => f._id === id);
    if (idx === -1) return null;
    files[idx] = { ...files[idx], ...updates, updatedAt: new Date().toISOString() };
    dataStore.saveFiles(files);

    if (mongoose.connection.readyState === 1) {
      FileModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' })
        .catch((err) => console.error('[MongoDB] FileModel update error:', err.message));
    }
    return files[idx];
  },

  deleteFile: (id: string) => {
    let files = dataStore.getFiles();
    files = files.filter((f) => f._id !== id);
    dataStore.saveFiles(files);

    if (mongoose.connection.readyState === 1) {
      FileModel.findByIdAndDelete(id).catch((err) => console.error('[MongoDB] FileModel delete error:', err.message));
    }
    return true;
  },

  // ================= CONVERSIONS =================
  getConversions: () => readJsonFile<any[]>(CONVERSIONS_FILE, INITIAL_CONVERSIONS),
  saveConversions: (conversions: any[]) => writeJsonFile(CONVERSIONS_FILE, conversions),

  getUserConversions: (userId: string) => {
    const conversions = dataStore.getConversions();
    return conversions.filter((c) => c.owner === userId);
  },

  createConversion: (convData: any) => {
    const conversions = dataStore.getConversions();
    const newConv = {
      _id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...convData,
    };
    conversions.unshift(newConv);
    dataStore.saveConversions(conversions);

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      ConversionModel.findOneAndUpdate(
        { _id: newConv._id },
        newConv,
        { upsert: true, returnDocument: 'after' }
      ).catch((err) => console.error('[MongoDB] ConversionModel save error:', err.message));
    }

    return newConv;
  },

  async createConversionAsync(convData: any) {
    const newConv = dataStore.createConversion(convData);
    if (mongoose.connection.readyState === 1) {
      try {
        await ConversionModel.findOneAndUpdate(
          { _id: newConv._id },
          newConv,
          { upsert: true, returnDocument: 'after' }
        );
      } catch (err: any) {
        console.error('[MongoDB] createConversionAsync error:', err.message);
      }
    }
    return newConv;
  },

  deleteConversion: (id: string) => {
    let conversions = dataStore.getConversions();
    conversions = conversions.filter((c) => c._id !== id);
    dataStore.saveConversions(conversions);

    if (mongoose.connection.readyState === 1) {
      ConversionModel.findByIdAndDelete(id).catch((err) => console.error('[MongoDB] ConversionModel delete error:', err.message));
    }
    return true;
  },

  clearUserConversions: (userId: string) => {
    const all = dataStore.getConversions();
    const filtered = all.filter((c) => c.owner !== userId);
    dataStore.saveConversions(filtered);

    if (mongoose.connection.readyState === 1) {
      ConversionModel.deleteMany({ owner: userId }).catch((err) => console.error('[MongoDB] Conversion deleteMany error:', err.message));
    }
  },

  // ================= ACTIVITY LOGS =================
  getLogs: () => readJsonFile<any[]>(LOGS_FILE, INITIAL_LOGS),

  createLog: (logData: any) => {
    const logs = dataStore.getLogs();
    const newLog = {
      _id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...logData,
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    writeJsonFile(LOGS_FILE, logs);

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      ActivityLogModel.create(newLog).catch((err) => console.error('[MongoDB] ActivityLogModel save error:', err.message));
    }

    return newLog;
  },

  // ================= SYSTEM SETTINGS =================
  getSettings: () => readJsonFile<Record<string, any>>(SETTINGS_FILE, INITIAL_SETTINGS),

  saveSettings: (settings: Record<string, any>) => {
    writeJsonFile(SETTINGS_FILE, settings);

    if (mongoose.connection.readyState === 1) {
      SystemSettingModel.findOneAndUpdate(
        { key: 'general_settings' },
        {
          _id: 'setting_general_001',
          key: 'general_settings',
          value: settings,
          description: 'Core platform configuration',
        },
        { upsert: true, returnDocument: 'after' }
      ).catch((err) => console.error('[MongoDB] SystemSettingModel save error:', err.message));
    }
  },

  // ================= PAYMENTS & TRANSACTIONS =================
  getPayments: (): any[] => readJsonFile<any[]>(PAYMENTS_FILE, []),

  getPaymentByTranId: (tranId: string): any | undefined => {
    const payments = dataStore.getPayments();
    return payments.find((p) => p.tranId === tranId);
  },

  getUserPayments: (userId: string): any[] => {
    const payments = dataStore.getPayments();
    return payments.filter((p) => p.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createPayment: (paymentData: any): any => {
    const payments = dataStore.getPayments();
    const newPayment = {
      _id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      gateway: 'SSLCommerz',
      ...paymentData,
    };
    payments.unshift(newPayment);
    writeJsonFile(PAYMENTS_FILE, payments);

    if (mongoose.connection.readyState === 1) {
      PaymentModel.create(newPayment).catch((err) => console.error('[MongoDB] Payment save error:', err.message));
    }

    return newPayment;
  },

  updatePayment: (tranId: string, updates: any): any | null => {
    const payments = dataStore.getPayments();
    const idx = payments.findIndex((p) => p.tranId === tranId);
    if (idx === -1) return null;

    payments[idx] = {
      ...payments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(PAYMENTS_FILE, payments);

    if (mongoose.connection.readyState === 1) {
      PaymentModel.findOneAndUpdate({ tranId }, { $set: updates }).catch((err) => console.error('[MongoDB] Payment update error:', err.message));
    }

    return payments[idx];
  },
};
