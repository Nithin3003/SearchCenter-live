import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Crown,
  Zap,
  Check,
  AlertTriangle,
  Star,
  CreditCard,
  Gift,
  ArrowRight,
  Info,
  X,
  Loader2
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { userService, UserSubscription } from '../services/userService';
import SubscriptionManager from './SubscriptionManager';

interface SubscriptionGateProps {
  feature: string;
  requiredTier?: 'pro' | 'ultra';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradeRequired?: (tier: 'pro' | 'ultra') => void;
}

export default function SubscriptionGate({
  feature,
  requiredTier = 'pro',
  children,
  fallback,
  onUpgradeRequired
}: SubscriptionGateProps) {
  const { user } = useUser();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    setIsChecking(true);
    try {
      const subscription = await userService.getUserSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  } finally {
    setIsChecking(false);
    }
  };

  const handleUpgrade = (tier: 'pro' | 'ultra') => {
    if (onUpgradeRequired) {
      onUpgradeRequired(tier);
    }
    setShowUpgradeModal(false);
  };

  const isFeatureAvailable = (): boolean => {
    if (!currentSubscription) return false;

    const tierAccess = {
      free: ['search', 'profile', 'basic_filters'],
      pro: ['advanced_filters', 'ai_projects', 'search_history', 'custom_themes', 'api_access', 'priority_support'],
      ultra: ['unlimited_search', 'unlimited_ai', 'unlimited_history', 'advanced_analytics', 'team_sharing', 'api_unlimited', 'priority_support_plus'],
    };

    const userFeatures = tierAccess[currentSubscription.tier] || [];

    return userFeatures.includes(feature);
  };

  const getFeatureIcon = (feature: string) => {
    const icons = {
      search: Search,
      ai_projects: Zap,
      advanced_filters: Shield,
      search_history: CreditCard,
      custom_themes: Palette,
      api_access: Lock,
      priority_support: Crown,
      unlimited_search: Star,
      team_sharing: Users,
    };

    return icons[feature as keyof typeof icons] || Info;
  };

  const getFeatureDescription = (feature: string): string => {
    const descriptions = {
      search: 'Advanced search functionality with unlimited results',
      ai_projects: 'AI-powered project builder and suggestions',
      advanced_filters: 'Advanced filtering options and custom filters',
      search_history: 'Unlimited search history and analytics',
      custom_themes: 'Custom themes and color schemes',
      api_access: 'Access to advanced API features',
      priority_support: 'Priority customer support and fast responses',
      unlimited_search: 'Unlimited search queries and instant results',
      unlimited_ai: 'Unlimited AI project generations',
      advanced_analytics: 'Detailed analytics and insights',
      team_sharing: 'Team collaboration and sharing features',
    };

    return descriptions[feature as keyof typeof descriptions] || 'Advanced feature';
  };

  const getUpgradeMessage = (requiredTier: 'pro' | 'ultra', currentTier: 'free' | 'pro' | 'ultra'): string => {
    if (currentTier === 'free' && requiredTier === 'pro') {
      return 'Unlock Pro features to search more, get AI-powered insights, and accelerate your development!';
    }
    if (currentTier === 'pro' && requiredTier === 'ultra') {
      return 'Upgrade to Ultra for unlimited AI projects and priority support!';
    }
    return 'Upgrade your plan to access this feature';
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-600">Checking subscription...</span>
      </div>
    );
  }

  if (isFeatureAvailable()) {
    return <>{children}</>;
  }

  return (
    <>
      {showUpgradeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-hidden p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Required</h3>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center">
                  <div className="text-center">
                    {getFeatureIcon(feature)}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">This feature requires {requiredTier.toUpperCase()}</h4>
                  <p className="text-gray-600 mt-1">{getFeatureDescription(feature)}</p>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="bg-gray-100 rounded-xl p-6">
                  <h5 className="text-lg font-bold text-gray-900 mb-4">
                    Your Current Plan: {currentSubscription.tier.toUpperCase()}
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Status:</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Features:</span>
                      <div className="text-gray-600">{Object.values(getFeatureDescription(feature)).length} / Object.keys(getFeatureDescription(feature)).length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Message */}
            <div className="mb-8">
              <p className="text-gray-700 text-center text-lg">
                {getUpgradeMessage(requiredTier, currentSubscription.tier)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade('ultra')}
                className={`relative p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium transition-all ${
                  requiredTier === 'ultra' ? 'ring-2 ring-purple-300' : ''
                }`}
              >
                {requiredTier === 'ultra' && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    BEST VALUE
                  </span>
                )}
                <div className="text-center">
                  <div className="mb-1">
                    <Crown className="h-6 w-6 mx-auto" />
                    <div>
                      <span className="font-bold">Ultra</span>
                      <div className="text-xs">₹999/mo</div>
                    </div>
                  </div>
                  <div className="text-sm opacity-80">Unlimited Everything</div>
                </div>
              </motion.button>

              {requiredTier === 'pro' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUpgrade('pro')}
                  className={`relative p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium transition-all`}
                >
                  <div className="text-center">
                    <div className="mb-1">
                      <Star className="h-6 w-6 mx-auto" />
                      <div>
                        <span className="font-bold">Pro</span>
                        <div className="text-xs">₹399/mo</div>
                      </div>
                    </div>
                    <div className="text-sm opacity-80">Powerful Features</div>
                  </div>
                </motion.button>
              )}
            </div>

            {/* Features Comparison */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Compare Plans</h4>
              <div className="space-y-4">
                {['Free', 'Pro', 'Ultra'].map((tier, index) => (
                  <div
                    key={tier}
                    className={`border-2 rounded-lg p-4 ${
                      tier === currentSubscription.tier
                        ? 'border-green-500 bg-green-50'
                        : tier === requiredTier
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg capitalize">{tier}</div>
                      {tier === currentSubscription.tier && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {tier === 'Free' && '10 searches/day • Basic features'}
                      {tier === 'Pro' && '1000 searches/day • AI projects • Advanced filters'}
                      {tier === 'Ultra' && 'Unlimited searches • Unlimited AI • Priority support'}
                    </div>
                    </div>

                    <div className="space-y-2">
                      {['search', 'ai_projects', 'advanced_filters', 'search_history', 'custom_themes', 'api_access', 'priority_support', 'unlimited_search', 'unlimited_ai'].map((feature) => (
                        <div key={feature} className="flex items-center mb-2">
                          <div className="text-center">
                            {getFeatureIcon(feature)}
                          </div>
                          <span className="text-sm text-gray-700 ml-2">{getFeatureDescription(feature)}</span>
                        </div>
                      ))}

                      {tier === 'Free' && (
                        <X className="h-4 w-4 text-gray-400 ml-auto" />
                      )}
                      {tier !== 'Free' && (
                        <Check className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUpgradeModal(false)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Maybe Later
            </motion.button>
          </motion.div>

          {/* Close Button */}
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )}

  {/* Fallback UI */}
  {fallback && !isFeatureAvailable() && (
    <div className="relative group">
      {children}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center z-10 group-hover:bg-opacity-75 transition-opacity">
        <div className="bg-white rounded-xl p-6 max-w-md mx-4">
          <div className="flex items-center mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {requiredTier.toUpperCase()} Feature
            </h4>
            <p className="text-gray-600 text-center">
              This feature requires a {requiredTier.toUpperCase()} subscription
            </p>
          </div>
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUpgradeModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Zap className="h-5 w-5 mr-2" />
              <span>Upgrade to {requiredTier.toUpperCase()}</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}