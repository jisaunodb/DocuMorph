import mongoose, { Schema, Document } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  avatar?: string;
  storageUsed: number; // bytes
  plan: 'free' | 'pro' | 'enterprise';
  conversionsCount: number;
  isActive: boolean;
  lastLogin?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    storageUsed: { type: Number, default: 0 },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    conversionsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// We define Mongoose model if mongoose is connected, or export type & schema
export const UserModel: mongoose.Model<IUser> =
  (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
