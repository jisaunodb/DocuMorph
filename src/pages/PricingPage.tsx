import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Check,
  Zap,
  Shield,
  Sparkles,
  Lock,
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Clock,
  HardDrive,
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Billing state (Strictly USD currency)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upgradedInfo, setUpgradedInfo] = useState<{
    plan: string;
    amount: number;
    billingCycle: string;
  } | null>(null);

  // Auto-trigger if URL has payment success
  const paymentStatus = searchParams.get('payment_status');
  useEffect(() => {
    if (paymentStatus === 'success') {
      setShowSuccessModal(true);
      refreshUser();
    }
  }, [paymentStatus, refreshUser]);

  const handleSelectPlan = async (planKey: 'free' | 'pro' | 'enterprise') => {
    if (planKey === 'free') {
      if (!isAuthenticated) {
        openAuthModal('Create a free starter account to begin processing documents.');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    // Check auth
    if (!isAuthenticated) {
      openAuthModal(`Sign in or register to upgrade your account to ${planKey.toUpperCase()} ($${planKey === 'pro' ? 4 : 19}/mo).`, () => {
        handleSelectPlan(planKey);
      });
      return;
    }

    setLoadingPlan(planKey);

    try {
      // 1-click production upgrade (direct activation in USD)
      const res = await api.upgradePlan({
        plan: planKey,
        billingCycle,
      });

      if (res.success) {
        await refreshUser();
        setUpgradedInfo({
          plan: planKey,
          amount: planKey === 'pro' ? (billingCycle === 'yearly' ? 38 : 4) : (billingCycle === 'yearly' ? 190 : 19),
          billingCycle,
        });
        setShowSuccessModal(true);
      } else {
        alert(res.message || 'Upgrade failed. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update subscription.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      badge: 'Zero Cost',
      price: '$0',
      period: 'forever',
      desc: 'Essential document conversions and basic utilities for individuals and students.',
      popular: false,
      features: [
        'Access to all 30+ conversion & editing tools',
        'Max 50MB per document',
        'Up to 20 files per batch',
        '500 MB private vault storage',
        'Full conversion history tracking',
        'Standard processing queue',
      ],
      cta: user?.plan === 'free' ? 'Current Plan' : 'Get Started Free',
      highlight: false,
      buttonVariant: 'secondary',
    },
    {
      id: 'pro',
      name: 'Professional',
      badge: 'Most Popular',
      price: billingCycle === 'yearly' ? '$3.15' : '$4',
      originalPrice: '$9',
      period: 'per month',
      billingNote:
        billingCycle === 'yearly'
          ? 'Billed annually ($38/year - Save 20%)'
          : 'Billed monthly, cancel anytime',
      desc: 'High-speed processing, massive vault storage, and batch conversions for power users.',
      popular: true,
      features: [
        'Everything in Free Starter',
        'Max 250MB per document',
        'Up to 100 files per batch processing',
        '25 GB encrypted vault storage',
        'Priority high-speed GPU OCR queue',
        'Bulk ZIP download packaging',
        'Direct Cloudinary syncing & previews',
        'Priority email & chat support',
      ],
      cta: user?.plan === 'pro' ? 'Active Plan' : 'Activate Pro Plan ($4/mo)',
      highlight: true,
      buttonVariant: 'primary',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      badge: 'Teams & Business',
      price: billingCycle === 'yearly' ? '$15.80' : '$19',
      originalPrice: '$39',
      period: 'per month',
      billingNote:
        billingCycle === 'yearly'
          ? 'Billed annually ($190/year)'
          : 'Billed monthly, cancel anytime',
      desc: 'Dedicated document automation, multi-user workspaces, and high-volume REST APIs.',
      popular: false,
      features: [
        'Everything in Professional',
        'Unlimited document file sizes',
        'Unlimited batch conversion queuing',
        '500 GB team vault storage',
        'Custom REST API keys & webhook integration',
        'Dedicated document processing server',
        'SAML 2.0 & Okta single sign-on (SSO)',
        '99.99% Uptime SLA agreement',
      ],
      cta: user?.plan === 'enterprise' ? 'Active Plan' : 'Get Enterprise Plan ($19/mo)',
      highlight: false,
      buttonVariant: 'secondary',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <SEOHead
        title="Plans & Pricing - DocuMorph Document Suite"
        description="Choose the ideal DocuMorph plan. Professional plan available for only $4/month with instant activation, 25 GB cloud vault, and high-speed GPU OCR."
        canonicalUrl="https://documorph.io/pricing"
      />

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>Professional Plan Now Only $4 / Month</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Simple, Transparent Pricing in USD
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Start for free or upgrade to Professional for just $4/month. Instant plan activation, massive cloud vault storage, and priority document processing.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg transition ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`p-8 bg-white rounded-3xl border ${
                plan.highlight
                  ? 'border-slate-900 shadow-xl ring-2 ring-slate-900/10'
                  : 'border-slate-200 shadow-xs'
              } flex flex-col justify-between relative transition hover:border-slate-400`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                  Most Popular • $4 / Mo
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{plan.desc}</p>
                </div>

                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-400">/{plan.period}</span>
                    {plan.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">{plan.originalPrice}</span>
                    )}
                  </div>
                  {plan.billingNote && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">{plan.billingNote}</p>
                  )}
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  {plan.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  disabled={isCurrentPlan || loadingPlan === plan.id}
                  onClick={() => handleSelectPlan(plan.id as any)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-2 ${
                    isCurrentPlan
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : plan.highlight
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Activating Plan...</span>
                    </>
                  ) : (
                    <>
                      {plan.id !== 'free' && <Zap className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{plan.cta}</span>
                    </>
                  )}
                </button>

                {plan.id !== 'free' && (
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    Instant 1-Click Upgrade • Cancel Anytime
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Guaranteed Production Performance</span>
          </div>
          <h3 className="text-xl font-black">All Plans Include High-Security Encryption</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Documents processed with 256-bit TLS encryption, automatic post-conversion file shredding, and zero permanent tracking.
          </p>
        </div>

        <div className="flex items-center space-x-6 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>99.9% Uptime</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant Access</span>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-slate-900 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3 text-xs">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1">
            <h4 className="font-bold text-slate-900">How much is the Professional plan?</h4>
            <p className="text-slate-500 leading-relaxed">
              The Professional plan is priced at <strong>$4 per month</strong> (or $38 per year with annual billing, giving a 20% discount).
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1">
            <h4 className="font-bold text-slate-900">How quickly is my plan upgraded?</h4>
            <p className="text-slate-500 leading-relaxed">
              Plan activation is immediate. As soon as you select your plan, your 25 GB encrypted vault, priority GPU queues, and high-volume limits are unlocked instantly.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1">
            <h4 className="font-bold text-slate-900">Can I cancel or switch plans at any time?</h4>
            <p className="text-slate-500 leading-relaxed">
              Yes, you can manage or cancel your subscription at any time directly from your Account Settings with zero penalties.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Plan Upgraded Successfully!</h3>
              <p className="text-xs text-slate-500">
                Your account is now active on{' '}
                <span className="font-bold text-slate-800 uppercase">
                  {upgradedInfo?.plan || user?.plan || 'PRO'} PLAN
                </span>
                .
              </p>
            </div>

            {/* Benefit Highlights Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center space-x-2 text-slate-700">
                <HardDrive className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>25 GB</strong> Cloud Storage Vault unlocked
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Priority GPU Queue</strong> for faster conversions
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>100 Files</strong> batch processing capacity
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSearchParams({});
                  navigate('/dashboard');
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Go to Workspace Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSearchParams({});
                  navigate('/tools');
                }}
                className="w-full py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition"
              >
                Explore Premium Tools
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
