import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog {
  _id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  category: 'auth' | 'tool' | 'file' | 'admin' | 'system';
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt?: Date | string;
}

export const ActivityLogSchema = new Schema<IActivityLog>(
  {
    _id: { type: String, required: true },
    userId: { type: String, index: true },
    userName: { type: String },
    userEmail: { type: String },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ['auth', 'tool', 'file', 'admin', 'system'],
      default: 'tool',
    },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const ActivityLogModel: mongoose.Model<IActivityLog> =
  (mongoose.models.ActivityLog as mongoose.Model<IActivityLog>) ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export interface ISystemSetting {
  _id: string;
  key: string;
  value: any;
  description: string;
  updatedBy?: string;
  updatedAt?: Date | string;
}

export const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    _id: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const SystemSettingModel: mongoose.Model<ISystemSetting> =
  (mongoose.models.SystemSetting as mongoose.Model<ISystemSetting>) ||
  mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
