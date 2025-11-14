/**
 * Admin Notification Service
 * Manages notifications for admin operations and system alerts
 * Designed specifically for admin email: msnithin84@gmail.com
 */

import { config } from '../config/envConfig';
import emailjs from '@emailjs/browser';

export interface AdminNotification {
  id: string;
  type: 'user_action' | 'system_alert' | 'payment' | 'security' | 'performance' | 'feature_usage';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
  requiresAction?: boolean;
  actionUrl?: string;
  userId?: string;
  userEmail?: string;
}

export interface NotificationTemplate {
  type: AdminNotification['type'];
  priority: AdminNotification['priority'];
  title: string;
  generateMessage: (data: any) => string;
  actionRequired?: boolean;
}

class AdminNotificationService {
  private adminEmail: string;
  private notifications: AdminNotification[] = [];
  private emailService: typeof emailjs;
  private isInitialized: boolean = false;

  constructor() {
    this.adminEmail = config.getAdminConfig().email;
    this.emailService = emailjs;
    this.initializeEmailService();
    this.loadStoredNotifications();
  }

  private initializeEmailService(): void {
    try {
      const emailConfig = config.getNotifications().emailjs;

      if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
        console.warn('EmailJS configuration incomplete. Email notifications will be disabled.');
        return;
      }

      this.emailService.init(emailConfig.publicKey);
      this.isInitialized = true;
      console.log('✅ Admin notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize admin notification service:', error);
    }
  }

  private loadStoredNotifications(): void {
    // Load notifications from localStorage for persistence
    try {
      const stored = localStorage.getItem('admin_notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        this.notifications = parsedNotifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load stored notifications:', error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('admin_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Predefined notification templates
  private getTemplates(): Record<string, NotificationTemplate> {
    return {
      // User management notifications
      user_registration: {
        type: 'user_action',
        priority: 'medium',
        title: 'New User Registration',
        generateMessage: (data) =>
          `New user registered:\n\nName: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nRegistration Time: ${new Date(data.timestamp).toLocaleString()}\n\nUser ID: ${data.userId}`,
        actionRequired: false
      },

      user_suspicious_activity: {
        type: 'security',
        priority: 'high',
        title: 'Suspicious User Activity Detected',
        generateMessage: (data) =>
          `Suspicious activity detected for user ${data.email}:\n\nActivity: ${data.activity}\nIP Address: ${data.ipAddress}\nTime: ${new Date(data.timestamp).toLocaleString()}\nDetails: ${data.details}\n\nRequires immediate attention.`,
        actionRequired: true
      },

      // Payment notifications
      payment_success: {
        type: 'payment',
        priority: 'medium',
        title: 'Payment Received',
        generateMessage: (data) =>
          `Payment received successfully:\n\nUser: ${data.userEmail}\nPlan: ${data.plan}\nAmount: ${data.amount} ${data.currency}\nPayment ID: ${data.paymentId}\nTime: ${new Date(data.timestamp).toLocaleString()}`,
        actionRequired: false
      },

      payment_failure: {
        type: 'payment',
        priority: 'high',
        title: 'Payment Failed',
        generateMessage: (data) =>
          `Payment failed:\n\nUser: ${data.userEmail}\nPlan: ${data.plan}\nAmount: ${data.amount} ${data.currency}\nError: ${data.error}\nTime: ${new Date(data.timestamp).toLocaleString()}`,
        actionRequired: true
      },

      subscription_cancelled: {
        type: 'payment',
        priority: 'medium',
        title: 'Subscription Cancelled',
        generateMessage: (data) =>
          `User cancelled subscription:\n\nUser: ${data.userEmail}\nPlan: ${data.plan}\nReason: ${data.reason}\nEnd Date: ${data.endDate}\nTime: ${new Date(data.timestamp).toLocaleString()}`,
        actionRequired: false
      },

      // System alerts
      system_error: {
        type: 'system_alert',
        priority: 'critical',
        title: 'System Error',
        generateMessage: (data) =>
          `Critical system error occurred:\n\nError: ${data.error}\nService: ${data.service}\nTime: ${new Date(data.timestamp).toLocaleString()}\nStack: ${data.stack}\n\nImmediate action required!`,
        actionRequired: true
      },

      high_memory_usage: {
        type: 'performance',
        priority: 'high',
        title: 'High Memory Usage Alert',
        generateMessage: (data) =>
          `High memory usage detected:\n\nUsage: ${data.usage}%\nThreshold: ${data.threshold}%\nTime: ${new Date(data.timestamp).toLocaleString()}\nService: ${data.service}\n\nConsider scaling resources.`,
        actionRequired: true
      },

      // Feature usage notifications
      ai_usage_spike: {
        type: 'feature_usage',
        priority: 'medium',
        title: 'AI Feature Usage Spike',
        generateMessage: (data) =>
          `Unusual spike in AI feature usage:\n\nFeature: ${data.feature}\nRequests: ${data.requests}\nNormal: ${data.normalRequests}\nTime: ${new Date(data.timestamp).toLocaleString()}\nUser: ${data.userEmail}`,
        actionRequired: false
      },

      search_limit_reached: {
        type: 'feature_usage',
        priority: 'medium',
        title: 'User Search Limit Reached',
        generateMessage: (data) =>
          `User reached search limit:\n\nUser: ${data.userEmail}\nLimit: ${data.limit}\nCurrent Usage: ${data.currentUsage}\nTime: ${new Date(data.timestamp).toLocaleString()}\nPlan: ${data.plan}`,
        actionRequired: false
      },

      // Security notifications
      login_attempt_blocked: {
        type: 'security',
        priority: 'high',
        title: 'Login Attempt Blocked',
        generateMessage: (data) =>
          `Multiple failed login attempts blocked:\n\nEmail/Username: ${data.identifier}\nAttempts: ${data.attempts}\nIP Address: ${data.ipAddress}\nTime: ${new Date(data.timestamp).toLocaleString()}\nDuration: ${data.blockDuration} minutes`,
        actionRequired: true
      },

      // Performance notifications
      api_response_slow: {
        type: 'performance',
        priority: 'medium',
        title: 'API Response Slow',
        generateMessage: (data) =>
          `API response time exceeded threshold:\n\nEndpoint: ${data.endpoint}\nResponse Time: ${data.responseTime}ms\nThreshold: ${data.threshold}ms\nTime: ${new Date(data.timestamp).toLocaleString()}`,
        actionRequired: false
      }
    };
  }

  // Public methods for creating notifications
  public async notify(templateKey: string, data: any): Promise<void> {
    const template = this.getTemplates()[templateKey];
    if (!template) {
      console.error(`Notification template '${templateKey}' not found`);
      return;
    }

    const notification: AdminNotification = {
      id: this.generateNotificationId(),
      type: template.type,
      priority: template.priority,
      title: template.title,
      message: template.generateMessage(data),
      timestamp: new Date(),
      data,
      requiresAction: template.actionRequired || false,
      userId: data.userId,
      userEmail: data.userEmail
    };

    await this.addNotification(notification);
  }

  private async addNotification(notification: AdminNotification): Promise<void> {
    // Add to local storage
    this.notifications.unshift(notification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();

    // Send email if critical or high priority
    if (notification.priority === 'critical' || notification.priority === 'high') {
      await this.sendEmailNotification(notification);
    }

    // Show in-app notification for immediate awareness
    this.showInAppNotification(notification);

    // Log to console in development
    if (config.isDevelopment()) {
      console.log(`🔔 Admin Notification [${notification.priority.toUpperCase()}]: ${notification.title}`);
      console.log(notification.message);
    }
  }

  private async sendEmailNotification(notification: AdminNotification): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Email service not initialized. Skipping email notification.');
      return;
    }

    try {
      const emailConfig = config.getNotifications().emailjs;

      const emailParams = {
        to_email: this.adminEmail,
        subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
        message: notification.message,
        priority: notification.priority,
        timestamp: notification.timestamp.toISOString(),
        notification_id: notification.id,
        type: notification.type,
        requires_action: notification.requiresAction ? 'Yes' : 'No',
        reply_to: notification.userEmail || 'no-reply@searchcenter.live'
      };

      await this.emailService.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        emailParams
      );

      console.log(`✅ Email notification sent: ${notification.title}`);
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);

      // Fallback: try to log to console for development
      if (config.isDevelopment()) {
        console.error('Email notification fallback - would send to:', this.adminEmail);
        console.error('Subject:', `[${notification.priority.toUpperCase()}] ${notification.title}`);
        console.error('Message:', notification.message);
      }
    }
  }

  private showInAppNotification(notification: AdminNotification): Promise<void> {
    // Create a custom event that can be listened to by the admin dashboard
    return new Promise((resolve) => {
      const event = new CustomEvent('adminNotification', {
        detail: {
          notification,
          timestamp: Date.now()
        }
      });

      window.dispatchEvent(event);
      resolve();
    });
  }

  // User management specific notifications
  public async notifyUserRegistration(userData: any): Promise<void> {
    await this.notify('user_registration', {
      ...userData,
      timestamp: new Date().toISOString()
    });
  }

  public async notifySuspiciousActivity(activityData: any): Promise<void> {
    await this.notify('user_suspicious_activity', {
      ...activityData,
      timestamp: new Date().toISOString()
    });
  }

  // Payment specific notifications
  public async notifyPaymentSuccess(paymentData: any): Promise<void> {
    await this.notify('payment_success', {
      ...paymentData,
      timestamp: new Date().toISOString()
    });
  }

  public async notifyPaymentFailure(paymentData: any): Promise<void> {
    await this.notify('payment_failure', {
      ...paymentData,
      timestamp: new Date().toISOString()
    });
  }

  public async notifySubscriptionCancelled(subscriptionData: any): Promise<void> {
    await this.notify('subscription_cancelled', {
      ...subscriptionData,
      timestamp: new Date().toISOString()
    });
  }

  // System specific notifications
  public async notifySystemError(errorData: any): Promise<void> {
    await this.notify('system_error', {
      ...errorData,
      timestamp: new Date().toISOString()
    });
  }

  public async notifyHighMemoryUsage(usageData: any): Promise<void> {
    await this.notify('high_memory_usage', {
      ...usageData,
      timestamp: new Date().toISOString()
    });
  }

  // Feature usage notifications
  public async notifyAIUsageSpike(usageData: any): Promise<void> {
    await this.notify('ai_usage_spike', {
      ...usageData,
      timestamp: new Date().toISOString()
    });
  }

  public async notifySearchLimitReached(limitData: any): Promise<void> {
    await this.notify('search_limit_reached', {
      ...limitData,
      timestamp: new Date().toISOString()
    });
  }

  // Security notifications
  public async notifyLoginAttemptBlocked(securityData: any): Promise<void> {
    await this.notify('login_attempt_blocked', {
      ...securityData,
      timestamp: new Date().toISOString()
    });
  }

  // Performance notifications
  public async notifyAPIResponseSlow(performanceData: any): Promise<void> {
    await this.notify('api_response_slow', {
      ...performanceData,
      timestamp: new Date().toISOString()
    });
  }

  // Getters for notification management
  public getNotifications(): AdminNotification[] {
    return [...this.notifications];
  }

  public getUnreadNotifications(): AdminNotification[] {
    // In a real implementation, you'd track read/unread status
    return this.notifications.filter(n =>
      n.priority === 'critical' || n.priority === 'high'
    );
  }

  public getNotificationsByType(type: AdminNotification['type']): AdminNotification[] {
    return this.notifications.filter(n => n.type === type);
  }

  public getNotificationsByPriority(priority: AdminNotification['priority']): AdminNotification[] {
    return this.notifications.filter(n => n.priority === priority);
  }

  public getRecentNotifications(hours: number = 24): AdminNotification[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.notifications.filter(n => n.timestamp > cutoff);
  }

  // Notification management
  public markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      // In a real implementation, you'd add a read property
      console.log(`Notification ${notificationId} marked as read`);
    }
  }

  public clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  public clearOldNotifications(daysOld: number = 7): void {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => n.timestamp > cutoff);
    this.saveNotifications();
  }

  // Analytics
  public getNotificationStats(): {
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    recent: number;
  } {
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    this.notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    return {
      total: this.notifications.length,
      byType,
      byPriority,
      recent: this.getRecentNotifications(24).length
    };
  }

  // Export for backup
  public exportNotifications(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      adminEmail: this.adminEmail,
      totalNotifications: this.notifications.length,
      notifications: this.notifications
    }, null, 2);
  }

  // Test notification method
  public async sendTestNotification(): Promise<void> {
    const testNotification: AdminNotification = {
      id: this.generateNotificationId(),
      type: 'system_alert',
      priority: 'medium',
      title: 'Test Notification',
      message: 'This is a test notification from SearchCenter Live admin system.\n\nIf you received this, the notification system is working correctly.',
      timestamp: new Date(),
      requiresAction: false
    };

    await this.addNotification(testNotification);
  }
}

// Export singleton instance
export const adminNotifications = new AdminNotificationService();

export default adminNotifications;