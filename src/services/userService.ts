import { useUser } from '@clerk/clerk-react';
import { axios } from 'axios';

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  searchHistory: string[];
  favoriteResources: string[];
  defaultContentType: 'all' | 'code' | 'videos' | 'datasets' | 'papers';
  notificationSettings: {
    email: boolean;
    push: boolean;
    recommendations: boolean;
    updates: boolean;
  };
  uiPreferences: {
    compactMode: boolean;
    showPreviews: boolean;
    defaultView: 'grid' | 'list';
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'ultra';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate?: string;
  features: {
    searchLimit: number;
    aiProjects: number;
    advancedFilters: boolean;
    customThemes: boolean;
    prioritySupport: boolean;
    unlimitedHistory: boolean;
  };
  razorpaySubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  skills: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  ranking: {
    level: number;
    points: number;
    contributions: number;
    reputation: number;
  };
  createdAt: string;
  updatedAt: string;
}

class UserService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await axios.put(`${this.baseUrl}/users/${userId}/preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  async createUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await axios.post(`${this.baseUrl}/users/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw new Error('Failed to create profile');
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await axios.put(`${this.baseUrl}/users/${userId}/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Subscription Management
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/subscription`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user subscription:', error);
      return null;
    }
  }

  async createSubscription(userId: string, tier: 'pro' | 'ultra', razorpayPaymentId: string): Promise<UserSubscription> {
    try {
      const response = await axios.post(`${this.baseUrl}/users/${userId}/subscription`, {
        tier,
        razorpayPaymentId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async updateSubscription(userId: string, subscriptionData: Partial<UserSubscription>): Promise<UserSubscription> {
    try {
      const response = await axios.put(`${this.baseUrl}/users/${userId}/subscription`, subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/users/${userId}/subscription`);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // User Behavior Tracking
  async trackUserAction(userId: string, action: {
    type: 'search' | 'view' | 'download' | 'bookmark' | 'share' | 'ai_project';
    resourceId?: string;
    resourceType?: string;
    query?: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/users/${userId}/actions`, {
        ...action,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sessionId: this.generateSessionId(),
      });
    } catch (error) {
      console.error('Failed to track user action:', error);
      // Don't throw error for tracking failures
    }
  }

  async getUserBehaviorData(userId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/behavior`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user behavior data:', error);
      return null;
    }
  }

  // Customer Ranking Algorithm
  async calculateUserRanking(userId: string): Promise<{
    level: number;
    points: number;
    contributions: number;
    reputation: number;
    nextLevelPoints: number;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/ranking`);
      return response.data;
    } catch (error) {
      console.error('Failed to calculate user ranking:', error);
      return {
        level: 1,
        points: 0,
        contributions: 0,
        reputation: 0,
        nextLevelPoints: 100,
      };
    }
  }

  async updateUserRanking(userId: string, action: {
    type: 'search' | 'contribution' | 'helpful_answer' | 'project_completion' | 'resource_share';
    points: number;
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/users/${userId}/ranking`, {
        ...action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update user ranking:', error);
      throw new Error('Failed to update ranking');
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(`${this.baseUrl}/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  // Advanced Search History
  async getDetailedSearchHistory(userId: string, limit = 50): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/search-history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch search history:', error);
      return [];
    }
  }

  async clearSearchHistory(userId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/users/${userId}/search-history`);
    } catch (error) {
      console.error('Failed to clear search history:', error);
      throw new Error('Failed to clear search history');
    }
  }
}

export const userService = new UserService();