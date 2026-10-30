import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment {
  _id: string;
  tranId: string;
  valId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: 'BDT' | 'USD';
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  gateway: string; // 'SSLCommerz'
  cardType?: string; // e.g. "BKASH-BKash", "NAGAD-Nagad", "VISA", "MASTERCARD"
  bankTranId?: string;
  gatewayPageUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const PaymentSchema = new Schema<IPayment>(
  {
    _id: { type: String, required: true },
    tranId: { type: String, required: true, unique: true, index: true },
    valId: { type: String, default: '' },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, default: '' },
    plan: { type: String, enum: ['pro', 'enterprise'], required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['BDT', 'USD'], default: 'BDT' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    gateway: { type: String, default: 'SSLCommerz' },
    cardType: { type: String, default: '' },
    bankTranId: { type: String, default: '' },
    gatewayPageUrl: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const PaymentModel: mongoose.Model<IPayment> =
  (mongoose.models.Payment as mongoose.Model<IPayment>) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);
