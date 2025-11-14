import { axios } from 'axios';

export interface UserAction {
  type: 'search' | 'contribution' | 'helpful_answer' | 'project_completion' | 'resource_share' | 'bookmark' | 'download' | 'rating';
  points: number;
  userId: string;
  resourceId?: string;
  resourceType?: string;
  query?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserRanking {
  userId: string;
  level: number;
  points: number;
  contributions: number;
  reputation: number;
  badges: {
    type: string;
    name: string;
    description: string;
    icon: string;
    requirement: number;
    earned: boolean;
  }[];
  streaks: {
    type: 'daily_search' | 'weekly_contribution' | 'monthly_active';
    count: number;
    lastReset: string;
    record: number;
  }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    points: number;
    unlocked: boolean;
    unlockedAt?: string;
    icon: string;
    category: string;
  }[];
  progress: {
    totalActions: number;
    uniqueActions: number;
    mostActiveDay: string;
    favoriteResourceType: string;
    lastActive: string;
  };
}

class RankingService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  // Base point values for different actions
  private readonly ACTION_POINTS = {
    search: 1,
    download: 2,
    bookmark: 3,
    share: 5,
    rating: 3,
    project_completion: 50,
    contribution: 25,
    helpful_answer: 15,
  } as const;

  private readonly LEVEL_THRESHOLDS = {
    1: 0,      // Novice
    2: 100,    // Beginner
    3: 500,    // Intermediate
    4: 2000,   // Advanced
    5: 8000,   // Expert
    6: 20000,  // Master
    7: 50000,  // Legend
    8: 100000, // Authority
  } as const;

  private readonly BADGES = [
    // Search Badges
    {
      type: 'search',
      name: 'Search Explorer',
      description: 'Perform 100 searches',
      requirement: 100,
      icon: '🔍',
      category: 'search',
    },
    {
      type: 'search',
      name: 'Knowledge Seeker',
      description: 'Perform 1000 searches',
      requirement: 1000,
      icon: '🔎',
      category: 'search',
    },

    // Contribution Badges
    {
      type: 'contribution',
      name: 'First Steps',
      description: 'Make your first contribution',
      requirement: 1,
      icon: '👟',
      category: 'contribution',
    },
    {
      type: 'contribution',
      name: 'Active Contributor',
      description: 'Make 50 contributions',
      requirement: 50,
      icon: '💪',
      category: 'contribution',
    },
    {
      type: 'contribution',
      name: 'Community Leader',
      description: 'Make 200 contributions',
      requirement: 200,
      icon: '👑',
      category: 'contribution',
    },

    // Learning Badges
    {
      type: 'project_completion',
      name: 'Project Starter',
      description: 'Complete your first AI project',
      requirement: 1,
      icon: '🚀',
      category: 'learning',
    },
    {
      type: 'project_completion',
      name: 'Project Builder',
      description: 'Complete 10 AI projects',
      requirement: 10,
      icon: '🏗',
      category: 'learning',
    },
    {
      type: 'project_completion',
      name: 'Project Architect',
      description: 'Complete 50 AI projects',
      requirement: 50,
      icon: '🏗',
      category: 'learning',
    },

    // Social Badges
    {
      type: 'resource_share',
      name: 'Helpful Helper',
      description: 'Share 25 resources',
      requirement: 25,
      icon: '🤝',
      category: 'social',
    },
    {
      type: 'resource_share',
      name: 'Knowledge Sharer',
      description: 'Share 100 resources',
      requirement: 100,
      icon: '📚',
      category: 'social',
    },
  ];

  private readonly ACHIEVEMENTS = [
    {
      id: 'first_search',
      title: 'First Search',
      description: 'You made your first search!',
      points: 10,
      unlocked: false,
      icon: '🔍',
      category: 'milestone',
    },
    {
      id: 'week_active',
      title: 'Weekly Warrior',
      description: '7 days of active searching',
      points: 50,
      unlocked: false,
      icon: '📅',
      category: 'consistency',
    },
    {
      id: 'month_active',
      title: 'Monthly Master',
      description: '30 days of active searching',
      points: 100,
      unlocked: false,
      icon: '📆',
      category: 'consistency',
    },
    {
      id: 'power_searcher',
      title: 'Power Searcher',
      description: 'Search 1000 times',
      points: 500,
      unlocked: false,
      icon: '⚡',
      category: 'milestone',
    },
    {
      id: 'ai_project_master',
      title: 'AI Project Master',
      description: 'Complete 100 AI projects',
      points: 1000,
      unlocked: false,
      icon: '🤖',
      category: 'mastery',
    },
  ];

  // Calculate user ranking based on actions and behavior
  async calculateUserRanking(userId: string): Promise<UserRanking> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/ranking`);
      return response.data;
    } catch (error) {
      console.error('Failed to calculate user ranking:', error);
      return this.getDefaultRanking();
    }
  }

  private getDefaultRanking(): UserRanking {
    return {
      userId,
      level: 1,
      points: 0,
      contributions: 0,
      reputation: 0,
      badges: this.getDefaultBadges(),
      streaks: this.getDefaultStreaks(),
      achievements: this.getDefaultAchievements(),
      progress: {
        totalActions: 0,
        uniqueActions: 0,
        mostActiveDay: new Date().toISOString().split('T')[0],
        favoriteResourceType: 'code',
        lastActive: new Date().toISOString(),
      },
    };
  }

  private getDefaultBadges() {
    return this.BADGES.filter(badge => badge.requirement === 0).map(badge => ({
      ...badge,
      earned: true,
    }));
  }

  private getDefaultStreaks() {
    const now = new Date();
    return [
      {
        type: 'daily_search',
        count: 0,
        lastReset: now.toISOString(),
        record: 0,
      },
      {
        type: 'weekly_contribution',
        count: 0,
        lastReset: this.getLastWeekStart(now).toISOString(),
        record: 0,
      },
      {
        type: 'monthly_active',
        count: 0,
        lastReset: this.getLastMonthStart(now).toISOString(),
        record: 0,
      },
    ];
  }

  private getDefaultAchievements() {
    return this.ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: false,
    }));
  }

  private getLastWeekStart(date: Date): Date {
    const lastWeekStart = new Date(date);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    return lastWeekStart;
  }

  private getLastMonthStart(date: Date): Date {
    const lastMonthStart = new Date(date);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    return lastMonthStart;
  }

  // Track user action
  async trackUserAction(action: Omit<UserAction, 'userId' | 'timestamp'>, userId: string): Promise<void> {
    try {
      const fullAction: UserAction = {
        ...action,
        userId,
        timestamp: new Date().toISOString(),
      };

      await axios.post(`${this.baseUrl}/users/${userId}/actions`, fullAction);

      // Update local ranking (optimistic update)
      this.updateLocalRanking(userId, action);
    } catch (error) {
      console.error('Failed to track user action:', error);
      throw new Error('Failed to track user action');
    }
  }

  // Update local ranking (for immediate UI feedback)
  private updateLocalRanking(userId: string, action: Omit<UserAction, 'userId' | 'timestamp'>): void {
    const localKey = `user_ranking_${userId}`;
    const current = this.getLocalRanking(userId);

    const updatedPoints = current.points + this.ACTION_POINTS[action.type];
    const updatedLevel = this.calculateLevel(updatedPoints);
    const updatedBadges = this.updateBadges(current.badges, action, current.points, updatedPoints);
    const updatedStreaks = this.updateStreaks(current.streaks, action);
    const updatedAchievements = this.updateAchievements(current.achievements, action, current.points);
    const updatedProgress = this.updateProgress(current.progress, action);

    const updatedRanking: UserRanking = {
      ...current,
      level: updatedLevel,
      points: updatedPoints,
      contributions: action.type === 'contribution' ? current.contributions + 1 : current.contributions,
      reputation: this.calculateReputation(updatedPoints, updatedLevel),
      badges: updatedBadges,
      streaks: updatedStreaks,
      achievements: updatedAchievements,
      progress: updatedProgress,
    };

    localStorage.setItem(localKey, JSON.stringify(updatedRanking));
  }

  private getLocalRanking(userId: string): UserRanking {
    const localKey = `user_ranking_${userId}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.getDefaultRanking();
  }

  private calculateLevel(points: number): number {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  private calculateReputation(points: number, level: number): number {
    // Reputation based on points and level
    const baseReputation = Math.floor(points / 10) + (level * 50);
    const bonusReputation = this.getBadgesForLevel(level).length * 20;
    return baseReputation + bonusReputation;
  }

  private updateBadges(currentBadges: UserRanking['badges'], action: UserAction, currentPoints: number, newPoints: number): UserRanking['badges'] {
    const updatedBadges = [...currentBadges];

    // Check for new badge unlocks
    for (const badge of this.BADGES) {
      const existingBadgeIndex = updatedBadges.findIndex(b => b.type === badge.type && b.name === badge.name);

      if (badge.type === action.type) {
        const actionProgress = this.getActionProgress(currentPoints, newPoints, badge.type);

        if (actionProgress >= badge.requirement && !updatedBadges.some(b => b.type === badge.type && b.name === badge.name && b.earned)) {
          // Earn new badge
          updatedBadges.push({
            ...badge,
            earned: true,
          });
        }
      }
    }

    return updatedBadges;
  }

  private getActionProgress(currentPoints: number, newPoints: number, actionType: string): number {
    const actionTypeProgress = {
      search: currentPoints,
      contribution: currentPoints,
      project_completion: currentPoints,
      resource_share: currentPoints,
      download: currentPoints,
      bookmark: currentPoints,
      rating: currentPoints,
      helpful_answer: currentPoints,
    };

    return actionTypeProgress[actionType] || 0;
  }

  private updateStreaks(currentStreaks: UserRanking['streaks'], action: UserAction): UserRanking['streaks'] {
    const updatedStreaks = [...currentStreaks];
    const now = new Date();

    // Update daily search streak
    if (action.type === 'search') {
      const dailyStreakIndex = updatedStreaks.findIndex(s => s.type === 'daily_search');
      if (dailyStreakIndex >= 0) {
        const streak = updatedStreaks[dailyStreakIndex];
        const today = new Date().toDateString();
        const lastResetDate = new Date(streak.lastReset).toDateString();

        if (today !== lastResetDate) {
          // Reset streak and increment count
          streak.count = 1;
          streak.lastReset = now.toISOString();
        } else {
          streak.count += 1;
          if (streak.count > streak.record) {
            streak.record = streak.count;
          }
        }

        updatedStreaks[dailyStreakIndex] = streak;
      }
    }

    return updatedStreaks;
  }

  private updateAchievements(currentAchievements: UserRanking['achievements'], action: UserAction, currentPoints: number): UserRanking['achievements'] {
    const updatedAchievements = [...currentAchievements];

    // Check achievement unlocks based on action type and progress
    for (const achievement of this.ACHIEVEMENTS) {
      if (!achievement.unlocked) {
        const achievementIndex = updatedAchievements.findIndex(a => a.id === achievement.id);
        if (achievementIndex >= 0) {
          const progress = this.getAchievementProgress(currentPoints, achievement);
          if (progress >= 1) {
            updatedAchievements[achievementIndex] = {
              ...achievement,
              unlocked: true,
              unlockedAt: new Date().toISOString(),
            };
          }
        }
      }
    }

    return updatedAchievements;
  }

  private getAchievementProgress(points: number, achievement: any): number {
    // Different achievements have different progress criteria
    switch (achievement.id) {
      case 'first_search':
        return points >= 10 ? 1 : 0;
      case 'week_active':
        return points >= 100 ? 1 : 0;
      case 'month_active':
        return points >= 300 ? 1 : 0;
      case 'power_searcher':
        return Math.floor(points / 1000); // Progress percentage
      case 'ai_project_master':
        return Math.floor(points / 100);
      default:
        return 0;
    }
  }

  private updateProgress(currentProgress: UserRanking['progress'], action: UserAction): UserRanking['progress'] {
    const updatedProgress = { ...currentProgress };
    const actionDate = new Date().toDateString();

    // Update various progress metrics
    updatedProgress.totalActions = currentProgress.totalActions + 1;

    if (action.query) {
      const uniqueActions = new Set([action.query, ...currentProgress.uniqueActions || []]);
      updatedProgress.uniqueActions = Array.from(uniqueActions);
    }

    // Update most active day if current action count > previous record
    if (actionDate === updatedProgress.mostActiveDay) {
      const dayActions = this.getActionsForDate(updatedProgress.totalActions, actionDate);
      const currentDayCount = updatedProgress.mostActiveDay ? this.getActionsForDate(updatedProgress.totalActions, updatedProgress.mostActiveDay) : 0;

      if (dayActions > currentDayCount) {
        updatedProgress.mostActiveDay = actionDate;
      }
    }

    // Update last active timestamp
    updatedProgress.lastActive = new Date().toISOString();

    // Update favorite resource type (most searched category)
    if (action.resourceType) {
      // Simple frequency counting - in real implementation, this would be more sophisticated
      const frequencies = this.getResourceTypeFrequencies(currentProgress.totalActions);
      const mostFrequent = Object.keys(frequencies).reduce((a, b) =>
        frequencies[a] > frequencies[b] ? a : b
      );

      updatedProgress.favoriteResourceType = mostFrequent as string;
    }

    return updatedProgress;
  }

  private getActionsForDate(totalActions: number, date: string): number {
    // This is a simplified implementation
    // In a real system, you'd track actions per date
    return Math.floor(totalActions / 30); // Approximate daily average
  }

  private getResourceTypeFrequencies(actions: number): Record<string, number> {
    // Simplified frequency calculation
    // In real implementation, this would use the actual action data
    return {
      code: Math.random() * 10,
      videos: Math.random() * 8,
      datasets: Math.random() * 5,
      papers: Math.random() * 7,
    };
  }

  // Get badge requirements for level
  private getBadgesForLevel(level: number): any[] {
    return this.BADGES.filter(badge => badge.requirement > 0 && level >= Math.floor(badge.requirement / 100));
  }

  // Get leaderboard
  async getLeaderboard(limit = 10, type = 'points'): Promise<{
    rank: number;
    totalUsers: number;
    users: {
      userId: string;
      name: string;
      avatar?: string;
      points: number;
      level: number;
      badges: number;
    }[];
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/leaderboard?limit=${limit}&type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return {
        rank: 0,
        totalUsers: 0,
        users: [],
      };
    }
  }

  // Get user's next level progress
  getNextLevelProgress(userId: string): {
    currentPoints: number;
    currentLevel: number;
    nextLevel: number;
    pointsToNext: number;
    progressPercentage: number;
  } {
    const ranking = this.getLocalRanking(userId);
    const currentLevel = ranking.level;
    const currentPoints = ranking.points;

    const nextLevel = Math.min(currentLevel + 1, this.LEVEL_THRESHOLDS.length);
    const currentThreshold = this.LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    const nextThreshold = this.LEVEL_THRESHOLDS[nextLevel - 1] || 0;
    const pointsToNext = nextThreshold - currentPoints;
    const levelRange = nextThreshold - currentThreshold;
    const progressInLevel = currentPoints - currentThreshold;
    const progressPercentage = levelRange > 0 ? (progressInLevel / levelRange) * 100 : 100;

    return {
      currentPoints,
      currentLevel,
      nextLevel,
      pointsToNext,
      progressPercentage,
    };
  }

  // Get personalized recommendations based on user rank and behavior
  async getPersonalizedRecommendations(userId: string): Promise<{
    resources: any[];
    reasons: string[];
    confidence: number;
  }> {
    try {
      const ranking = this.calculateUserRanking(userId);
      const levelMultiplier = Math.max(1, ranking.level / 3);

      const response = await axios.get(`${this.baseUrl}/recommendations/personalized/${userId}`, {
        params: {
          level: ranking.level,
          points: ranking.points,
          levelMultiplier,
          recentActions: ranking.progress.totalActions,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return {
        resources: [],
        reasons: [],
        confidence: 0,
      };
    }
  }
}

export const rankingService = new RankingService();