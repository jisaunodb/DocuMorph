import mongoose, { Schema, Document } from 'mongoose';

export interface IConversion {
  _id: string;
  originalFileId?: string;
  originalFileName: string;
  originalFileSize: number;
  outputFileName: string;
  outputFileSize: number;
  outputUrl?: string;
  outputDownloadUrl: string;
  conversionType: string;
  toolSlug: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  owner: string; // User ID
  processingTimeMs?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const ConversionSchema = new Schema<IConversion>(
  {
    _id: { type: String, required: true },
    originalFileId: { type: String },
    originalFileName: { type: String, required: true },
    originalFileSize: { type: Number, required: true },
    outputFileName: { type: String, required: true },
    outputFileSize: { type: Number, default: 0 },
    outputUrl: { type: String },
    outputDownloadUrl: { type: String, required: true },
    conversionType: { type: String, required: true },
    toolSlug: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    errorMessage: { type: String },
    owner: { type: String, required: true, index: true },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

export const ConversionModel: mongoose.Model<IConversion> =
  (mongoose.models.Conversion as mongoose.Model<IConversion>) ||
  mongoose.model<IConversion>('Conversion', ConversionSchema);
