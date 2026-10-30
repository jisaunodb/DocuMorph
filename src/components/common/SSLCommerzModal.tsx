import React, { useState } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, X, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SSLCommerzModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'pro' | 'enterprise';
  amount: number;
  currency: 'BDT' | 'USD';
  tranId: string;
  gatewayUrl?: string;
  onSuccess: (tranId: string, plan: string) => void;
}

export const SSLCommerzModal: React.FC<SSLCommerzModalProps> = ({
  isOpen,
  onClose,
  plan,
  amount,
  currency,
  tranId,
  gatewayUrl,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card' | 'bank'>('bkash');
  const [accountNumber, setAccountNumber] = useState('01712345678');
  const [pin, setPin] = useState('1234');
  const [step, setStep] = useState<'method' | 'otp' | 'processing' | 'done'>('method');
  const [otp, setOtp] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'bkash',
      name: 'bKash (বিকাশ)',
      category: 'mobile',
      color: 'bg-pink-600',
      textColor: 'text-pink-600',
      badge: 'Popular in BD',
      icon: '🌸',
    },
    {
      id: 'nagad',
      name: 'Nagad (নগদ)',
      category: 'mobile',
      color: 'bg-orange-600',
      textColor: 'text-orange-600',
      badge: 'Zero Charge',
      icon: '⚡',
    },
    {
      id: 'rocket',
      name: 'Rocket (DBBL)',
      category: 'mobile',
      color: 'bg-purple-700',
      textColor: 'text-purple-700',
      icon: '🚀',
    },
    {
      id: 'card',
      name: 'Visa / MasterCard',
      category: 'card',
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      badge: 'International',
      icon: '💳',
    },
    {
      id: 'bank',
      name: 'Internet Banking',
      category: 'bank',
      color: 'bg-emerald-700',
      textColor: 'text-emerald-700',
      icon: '🏦',
    },
  ];

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || accountNumber.length < 8) {
      setErrorMsg('Please enter a valid mobile number or card account.');
      return;
    }
    setErrorMsg(null);
    setStep('otp');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const methodName =
      selectedMethod === 'bkash'
        ? 'bKash Online'
        : selectedMethod === 'nagad'
        ? 'Nagad Direct'
        : selectedMethod === 'rocket'
        ? 'Rocket DBBL'
        : selectedMethod === 'card'
        ? 'Visa/MasterCard'
        : 'City Touch / Internet Banking';

    try {
      const res = await api.simulateCompletePayment({
        tranId,
        paymentMethod: methodName,
        phoneNumber: accountNumber,
      });

      if (res.success) {
        await refreshUser();
        setStep('done');
        setTimeout(() => {
          onSuccess(tranId, plan);
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Payment processing failed. Please retry.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during SSLCommerz processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* SSLCommerz Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>SSLCommerz Certified Secure Gateway</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <h3 className="text-xl font-extrabold text-white">DocuMorph {plan.toUpperCase()}</h3>
              <p className="text-xs text-slate-300">Transaction ID: {tranId.slice(0, 16)}...</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-rose-400">
                {currency === 'BDT' ? `৳${amount}` : `$${amount}`}
              </span>
              <span className="block text-[11px] text-slate-300">
                {currency === 'BDT' ? `(Approx $${plan === 'pro' ? 4 : 19} USD)` : `(BDT ${amount * 120})`}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'method' && (
            <form onSubmit={handleProceedToOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Channel</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition relative ${
                        selectedMethod === m.id
                          ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg">{m.icon}</span>
                        {m.badge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-xs text-slate-900 mt-2">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedMethod === 'card'
                    ? 'Card Number (16 Digits)'
                    : `${paymentMethods.find((m) => m.id === selectedMethod)?.name} Account Mobile Number`}
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={selectedMethod === 'card' ? '4123 4567 8901 2345' : '017XXXXXXXX'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    Proceed to Pay {currency === 'BDT' ? `৳${amount}` : `$${amount}`} via SSLCommerz
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 pt-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted &amp; Bangladesh Bank Authorized</span>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleConfirmPayment} className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                <p className="font-bold">SSLCommerz Sandbox Verification</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  A verification OTP code was dispatched to <strong>{accountNumber}</strong>. (Default sandbox code:{' '}
                  <span className="font-mono font-bold">123456</span>)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Verification Code (OTP)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono tracking-widest font-bold outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedMethod === 'card' ? 'Card CVV / CVC' : 'Mobile Banking PIN'}
                </label>
                <input
                  type="password"
                  required
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono tracking-widest font-bold outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Verifying with SSLCommerz...</span>
                  ) : (
                    <span>Confirm &amp; Activate Plan</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-500">
                Your account has been upgraded to <strong>DocuMorph {plan.toUpperCase()}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
