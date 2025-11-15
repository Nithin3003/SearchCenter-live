import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Check,
  X,
  CreditCard,
  Calendar,
  Zap,
  Shield,
  Users,
  Star,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Loader2,
  Gift,
  Tag
} from 'lucide-react';
import { razorpayService, SubscriptionPlan } from '../services/razorpayService';
import { userService, UserSubscription } from '../services/userService';
import { useUser } from '@clerk/clerk-react';

interface SubscriptionManagerProps {
  onSubscriptionChange?: (subscription: UserSubscription) => void;
}

export default function SubscriptionManager({ onSubscriptionChange }: SubscriptionManagerProps) {
  const { user } = useUser();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = razorpayService.getSubscriptionPlans();
  const filteredPlans = billingCycle === 'monthly'
    ? plans.filter(p => p.interval === 'monthly')
    : plans.filter(p => p.interval === 'yearly');

  useEffect(() => {
    if (user) {
      loadUserSubscription();
    }
  }, [user]);

  const loadUserSubscription = async () => {
    if (!user) return;

    try {
      const subscription = await userService.getUserSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setError(null);
    setShowSuccess(false);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create Razorpay order
      const order = await razorpayService.createOrder(selectedPlan, user.id, user.emailAddresses?.[0]?.emailAddress || '');

      // Initialize payment
      await razorpayService.initializePayment(order, selectedPlan);

    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;

    try {
      const couponResult = await razorpayService.validateCoupon(couponCode, selectedPlan.id);
      setCouponData(couponResult);

      if (!couponResult.valid) {
        setError(couponResult.message || 'Invalid coupon code');
      }
    } catch (error) {
      setError('Failed to validate coupon. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    setIsLoading(true);
    try {
      await razorpayService.cancelSubscription(currentSubscription.id, 'User requested cancellation');
      setCurrentSubscription(null);
      onSubscriptionChange?.(null as any);
    } catch (error) {
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'search': return Search;
      case 'ai': return Zap;
      case 'filters': return Shield;
      case 'themes': return Users;
      case 'support': return Crown;
      case 'history': return Calendar;
      case 'api': return CreditCard;
      case 'storage': return Database;
      default: return Check;
    }
  };

  const isPlanCurrent = (plan: SubscriptionPlan) => {
    return currentSubscription?.tier === plan.tier;
  };

  const getDiscountedPrice = (plan: SubscriptionPlan) => {
    if (!couponData?.valid || !couponData.discount) return plan.price;

    if (couponData.discountType === 'percentage') {
      return plan.price * (1 - couponData.discount / 100);
    } else if (couponData.discountType === 'fixed') {
      return Math.max(0, plan.price - couponData.discount);
    }

    return plan.price;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-2xl">
          <div className="text-center">
            <Crown className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-purple-100 max-w-md mx-auto">
              Unlock unlimited searches, AI-powered projects, and advanced features to accelerate your development journey.
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-full flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 15%
                </span>
              </button>
            </div>
          </div>

          {/* Current Subscription Alert */}
          {currentSubscription && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Current Plan: {currentSubscription.tier.toUpperCase()}</h3>
                  <p className="text-blue-700 text-sm">
                    Active until {new Date(currentSubscription.endDate || '').toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {filteredPlans.map((plan, index) => {
              const price = getDiscountedPrice(plan);
              const isPopular = plan.popular;
              const isCurrent = isPlanCurrent(plan);

              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: isCurrent ? 1 : 1.02 }}
                  whileTap={{ scale: isCurrent ? 1 : 0.98 }}
                  onClick={() => !isCurrent && handlePlanSelect(plan)}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'border-purple-500 shadow-lg'
                      : isCurrent
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      POPULAR
                    </div>
                  )}

                  {/* Current Badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      CURRENT
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {razorpayService.formatCurrency(price)}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">/{plan.interval}</span>
                    </div>

                    {/* Savings Display */}
                    {plan.savings && (
                      <div className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                        {plan.savings}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {typeof value === 'boolean' && value ? (
                            <>
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                              <span>{value}</span>
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {isCurrent ? (
                    <div className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-center font-medium">
                      Your Current Plan
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        selectedPlan?.id === plan.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      Get Started
                      <ChevronRight className="inline ml-2 h-4 w-4" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Coupon Input */}
          <div className="mb-8">
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={!couponCode.trim() || isLoading}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>

              {/* Coupon Result */}
              {couponData && (
                <div className={`mt-2 text-sm ${
                  couponData.valid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {couponData.valid ? (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      Coupon applied! {couponData.discount && `- ${couponData.discount}% off`}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {couponData.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Purchase Button */}
          {selectedPlan && !isPlanCurrent(selectedPlan) && (
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePurchase}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay {razorpayService.formatCurrency(getDiscountedPrice(selectedPlan))}
                    with Razorpay
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Free Plan Notice */}
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Free Plan</span> • 10 searches per day • Basic features
            </p>
            <button
              onClick={() => setSelectedPlan(plans.find(p => p.tier === 'free')!)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
            >
              Continue with Free Plan
            </button>
          </div>
        </div>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-8 max-w-md mx-4 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">
                Your subscription has been activated. You can now enjoy all premium features.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}