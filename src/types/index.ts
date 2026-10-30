export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  storageUsed: number;
  plan: 'free' | 'pro' | 'enterprise';
  conversionsCount: number;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface StoredFile {
  _id: string;
  originalName: string;
  currentName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
  localPath?: string;
  owner: string;
  processingStatus: 'ready' | 'processing' | 'completed' | 'failed';
  isFavorite: boolean;
  category: 'pdf' | 'document' | 'image' | 'converted';
  createdAt: string;
  updatedAt: string;
}

export interface ConversionRecord {
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
  owner: string;
  processingTimeMs?: number;
  createdAt: string;
}

export type ToolCategory =
  | 'All Tools'
  | 'Organize PDF'
  | 'Optimize PDF'
  | 'Convert to PDF'
  | 'Convert from PDF'
  | 'Edit PDF'
  | 'PDF Security'
  | 'PDF Intelligence'
  | 'PDF Tools'
  | 'Document Tools'
  | 'Image Tools'
  | 'Conversion Tools'
  | 'Editing Tools'
  | 'Security Tools'
  | 'OCR Tools';

export interface ToolMeta {
  slug: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: ToolCategory;
  icon: string;
  popular?: boolean;
  acceptedFormats: string[]; // e.g. ['.pdf', '.png']
  acceptedMimeTypes: string[];
  maxFiles: number;
  badge?: string;
  features: string[];
  howToSteps: string[];
  faq: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  totalStorageBytes: number;
  topTools: Array<{ name: string; count: number }>;
  categoryBreakdown: Record<string, number>;
  recentLogs: any[];
}

export interface PaymentTransaction {
  _id: string;
  tranId: string;
  valId?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  plan: 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: 'BDT' | 'USD';
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  gateway: string;
  cardType?: string;
  bankTranId?: string;
  gatewayPageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
