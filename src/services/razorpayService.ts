import axios from 'axios';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'pro' | 'ultra';
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: {
    searchLimit: string;
    aiProjects: string;
    advancedFilters: boolean;
    customThemes: boolean;
    prioritySupport: boolean;
    unlimitedHistory: boolean;
    apiAccess: boolean;
    storageLimit: string;
  };
  popular?: boolean;
  savings?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  notes?: string;
  customer?: {
    name: string;
    email: string;
    contact?: string;
  };
}

class RazorpayService {
  private key: string;
  private scriptLoaded = false;

  constructor() {
    this.key = import.meta.env.VITE_RAZORPAY_KEY || '';
  }

  // Load Razorpay script
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scriptLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.head.appendChild(script);
    });
  }

  // Get available subscription plans
  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'pro-monthly',
        name: 'Pro Monthly',
        tier: 'pro',
        price: 39,
        currency: 'INR',
        interval: 'monthly',
        popular: true,
        features: {
          searchLimit: '1000 per day',
          aiProjects: '20 per month',
          advancedFilters: true,
          customThemes: true,
          prioritySupport: true,
          unlimitedHistory: true,
          apiAccess: false,
          storageLimit: '10 GB',
        },
      },
      {
        id: 'pro-yearly',
        name: 'Pro Yearly',
        tier: 'pro',
        price: 399,
        currency: 'INR',
        interval: 'yearly',
        savings: 'Save 15%',
        features: {
          searchLimit: '1000 per day',
          aiProjects: '20 per month',
          advancedFilters: true,
          customThemes: true,
          prioritySupport: true,
          unlimitedHistory: true,
          apiAccess: false,
          storageLimit: '10 GB',
        },
      },
      {
        id: 'ultra-monthly',
        name: 'Ultra Monthly',
        tier: 'ultra',
        price: 99,
        currency: 'INR',
        interval: 'monthly',
        features: {
          searchLimit: 'Unlimited',
          aiProjects: 'Unlimited',
          advancedFilters: true,
          customThemes: true,
          prioritySupport: true,
          unlimitedHistory: true,
          apiAccess: true,
          storageLimit: '100 GB',
        },
      },
      {
        id: 'ultra-yearly',
        name: 'Ultra Yearly',
        tier: 'ultra',
        price: 999,
        currency: 'INR',
        interval: 'yearly',
        savings: 'Save 16%',
        features: {
          searchLimit: 'Unlimited',
          aiProjects: 'Unlimited',
          advancedFilters: true,
          customThemes: true,
          prioritySupport: true,
          unlimitedHistory: true,
          apiAccess: true,
          storageLimit: '100 GB',
        },
      },
    ];
  }

  // Create Razorpay order
  async createOrder(plan: SubscriptionPlan, userId: string, userEmail: string): Promise<RazorpayOrder> {
    try {
      const response = await axios.post('/api/razorpay/create-order', {
        planId: plan.id,
        amount: plan.price * 100, // Convert to paise
        currency: plan.currency,
        receipt: `subscription_${plan.id}_${userId}`,
        notes: {
          userId,
          planTier: plan.tier,
          interval: plan.interval,
        },
        customer: {
          name: userEmail,
          email: userEmail,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Initialize Razorpay checkout
  async initializePayment(order: RazorpayOrder, plan: SubscriptionPlan): Promise<any> {
    await this.loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded');
    }

    const options = {
      key: this.key,
      amount: order.amount,
      currency: order.currency,
      name: plan.name,
      description: `${plan.name} subscription for SearchCenter`,
      image: '/logo.png',
      order_id: order.id,
      handler: (response: any) => {
        // Handle payment success
        this.handlePaymentSuccess(response, order, plan);
      },
      prefill: {
        name: order.customer?.name || '',
        email: order.customer?.email || '',
        contact: order.customer?.contact || '',
      },
      notes: {
        ...order.notes,
      },
      theme: {
        color: '#6366f1',
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        },
        escape: true,
        backdropclose: false,
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  }

  // Handle payment success
  private async handlePaymentSuccess(response: any, order: RazorpayOrder, plan: SubscriptionPlan): Promise<void> {
    try {
      // Verify payment with backend
      await axios.post('/api/razorpay/verify-payment', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        planId: plan.id,
        orderData: order,
      });

      // Show success message
      this.showSuccessMessage('Payment successful! Your subscription is now active.');

    } catch (error) {
      console.error('Payment verification failed:', error);
      this.showErrorMessage('Payment verification failed. Please contact support.');
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      await axios.post('/api/razorpay/cancel-subscription', {
        subscriptionId,
        reason,
      });

      this.showSuccessMessage('Subscription cancelled successfully.');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      this.showErrorMessage('Failed to cancel subscription. Please try again.');
    }
  }

  // Get subscription status
  async getSubscriptionStatus(subscriptionId: string): Promise<{
    status: 'active' | 'cancelled' | 'expired';
    endDate?: string;
    renewalDate?: string;
  }> {
    try {
      const response = await axios.get(`/api/razorpay/subscription-status/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { status: 'cancelled' };
    }
  }

  // Update payment method
  async updatePaymentMethod(subscriptionId: string, paymentMethodData: any): Promise<void> {
    try {
      await axios.post('/api/razorpay/update-payment-method', {
        subscriptionId,
        paymentMethodData,
      });

      this.showSuccessMessage('Payment method updated successfully.');
    } catch (error) {
      console.error('Failed to update payment method:', error);
      this.showErrorMessage('Failed to update payment method. Please try again.');
    }
  }

  // Get payment history
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`/api/razorpay/payment-history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  }

  // UI helper methods
  private showSuccessMessage(message: string): void {
    // You can replace this with your preferred notification system
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'success', message }
      }));
    }
  }

  private showErrorMessage(message: string): void {
    // You can replace this with your preferred notification system
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'error', message }
      }));
    }
  }

  // Format currency display
  formatCurrency(amount: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate savings
  calculateSavings(monthlyPrice: number, yearlyPrice: number): string {
    const yearlyMonthlyEquivalent = yearlyPrice / 12;
    const savings = monthlyPrice - yearlyMonthlyEquivalent;
    const savingsPercent = Math.round((savings / monthlyPrice) * 100);

    return `Save ${savingsPercent}% (${this.formatCurrency(savings * 12)})`;
  }

  // Validate coupon
  async validateCoupon(code: string, planId: string): Promise<{
    valid: boolean;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    newPrice?: number;
    message?: string;
  }> {
    try {
      const response = await axios.post('/api/razorpay/validate-coupon', {
        code,
        planId,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to validate coupon:', error);
      return {
        valid: false,
        message: 'Invalid coupon code',
      };
    }
  }
}

export const razorpayService = new RazorpayService();