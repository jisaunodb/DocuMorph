import mongoose, { Schema, Document } from 'mongoose';

export interface IFile {
  _id: string;
  originalName: string;
  currentName: string;
  fileType: string;
  mimeType: string;
  fileSize: number; // in bytes
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
  localPath?: string;
  owner: string; // User ID or 'guest'
  processingStatus: 'ready' | 'processing' | 'completed' | 'failed';
  isFavorite: boolean;
  category: 'pdf' | 'document' | 'image' | 'converted';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const FileSchema = new Schema<IFile>(
  {
    _id: { type: String, required: true },
    originalName: { type: String, required: true },
    currentName: { type: String, required: true },
    fileType: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    cloudinaryUrl: { type: String },
    cloudinaryPublicId: { type: String },
    thumbnailUrl: { type: String },
    localPath: { type: String },
    owner: { type: String, required: true, index: true },
    processingStatus: {
      type: String,
      enum: ['ready', 'processing', 'completed', 'failed'],
      default: 'ready',
    },
    isFavorite: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['pdf', 'document', 'image', 'converted'],
      default: 'document',
    },
  },
  { timestamps: true }
);

export const FileModel: mongoose.Model<IFile> =
  (mongoose.models.File as mongoose.Model<IFile>) || mongoose.model<IFile>('File', FileSchema);
