/**
 * Search Analytics Service
 * Provides comprehensive search analytics and monitoring capabilities
 */

export interface SearchQuery {
  id: string;
  query: string;
  userId?: string;
  timestamp: Date;
  resultCount: number;
  responseTime: number;
  contentType: 'all' | 'code' | 'videos' | 'datasets' | 'papers';
  filters: {
    language?: string;
    timeRange?: string;
    sort?: string;
    source?: string;
  };
  sessionId: string;
  userAgent: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

export interface SearchMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  topQueries: Array<{
    query: string;
    count: number;
    lastSearched: Date;
  }>;
  contentTypeDistribution: Record<string, number>;
  hourlyDistribution: Record<string, number>;
  dailyDistribution: Record<string, number>;
  userActivity: Array<{
    userId: string;
    queryCount: number;
    lastActive: Date;
  }>;
  performanceMetrics: {
    averageResponseTime: number;
    fastestResponse: number;
    slowestResponse: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  apiStatus: Record<string, boolean>;
  lastCheck: Date;
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    resolved?: boolean;
  }>;
}

class SearchAnalyticsService {
  private searchQueries: SearchQuery[] = [];
  private metrics: SearchMetrics | null = null;
  private systemHealth: SystemHealth | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'search_analytics';
  private readonly METRICS_KEY = 'search_metrics';
  private readonly HEALTH_KEY = 'system_health';

  constructor() {
    this.loadData();
    this.startMonitoring();
  }

  // Core analytics methods
  public trackSearch(searchData: Partial<SearchQuery>): void {
    const query: SearchQuery = {
      id: this.generateId(),
      query: searchData.query || '',
      userId: searchData.userId,
      timestamp: new Date(),
      resultCount: searchData.resultCount || 0,
      responseTime: searchData.responseTime || 0,
      contentType: searchData.contentType || 'all',
      filters: searchData.filters || {},
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      success: searchData.success !== false,
      errorMessage: searchData.errorMessage,
    };

    this.searchQueries.unshift(query);
    this.saveData();
    this.updateMetrics();

    // Store in recent searches for user
    if (searchData.userId) {
      this.saveUserRecentSearch(searchData.userId, searchData.query);
    }

    console.log('🔍 Search tracked:', query);
  }

  public getMetrics(): SearchMetrics {
    if (!this.metrics) {
      this.calculateMetrics();
    }
    return this.metrics!;
  }

  public getSystemHealth(): SystemHealth {
    if (!this.systemHealth) {
      this.updateSystemHealth();
    }
    return this.systemHealth!;
  }

  public getSearchHistory(limit: number = 100, userId?: string): SearchQuery[] {
    let filtered = this.searchQueries;

    if (userId) {
      filtered = filtered.filter(q => q.userId === userId);
    }

    return filtered.slice(0, limit);
  }

  public getUserSearchHistory(userId: string, limit: number = 50): string[] {
    const historyKey = `user_search_history_${userId}`;
    const history = localStorage.getItem(historyKey);
    return history ? JSON.parse(history) : [];
  }

  public getTopQueries(limit: number = 10, timeRange?: 'day' | 'week' | 'month'): Array<{query: string; count: number}> {
    let filtered = this.searchQueries;

    if (timeRange) {
      const now = new Date();
      const cutoff = new Date();

      switch (timeRange) {
        case 'day':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(q => q.timestamp >= cutoff);
    }

    const queryCounts = new Map<string, number>();
    filtered.forEach(q => {
      if (q.success && q.query.trim()) {
        queryCounts.set(q.query, (queryCounts.get(q.query) || 0) + 1);
      }
    });

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public getContentTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {
      all: 0,
      code: 0,
      videos: 0,
      datasets: 0,
      papers: 0,
    };

    this.searchQueries.forEach(q => {
      if (q.success) {
        distribution[q.contentType]++;
      }
    });

    return distribution;
  }

  public getHourlyDistribution(days: number = 7): Record<string, number> {
    const distribution: Record<string, number> = {};
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 24; i++) {
      distribution[i.toString().padStart(2, '0')] = 0;
    }

    this.searchQueries
      .filter(q => q.timestamp >= cutoff && q.success)
      .forEach(q => {
        const hour = q.timestamp.getHours().toString().padStart(2, '0');
        distribution[hour]++;
      });

    return distribution;
  }

  public getUserActivity(limit: number = 20): Array<{userId: string; queryCount: number; lastActive: Date}> {
    const userActivity = new Map<string, {queryCount: number; lastActive: Date}>();

    this.searchQueries.forEach(q => {
      if (q.userId && q.success) {
        const current = userActivity.get(q.userId) || { queryCount: 0, lastActive: q.timestamp };
        current.queryCount++;
        if (q.timestamp > current.lastActive) {
          current.lastActive = q.timestamp;
        }
        userActivity.set(q.userId, current);
      }
    });

    return Array.from(userActivity.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, limit);
  }

  public getPerformanceMetrics(): SearchMetrics['performanceMetrics'] {
    const successfulQueries = this.searchQueries.filter(q => q.success && q.responseTime > 0);

    if (successfulQueries.length === 0) {
      return {
        averageResponseTime: 0,
        fastestResponse: 0,
        slowestResponse: 0,
        errorRate: 0,
        cacheHitRate: 0,
      };
    }

    const responseTimes = successfulQueries.map(q => q.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const fastestResponse = Math.min(...responseTimes);
    const slowestResponse = Math.max(...responseTimes);

    const failedQueries = this.searchQueries.filter(q => !q.success);
    const errorRate = (failedQueries.length / this.searchQueries.length) * 100;

    // Simulate cache hit rate based on repeated queries
    const uniqueQueries = new Set(this.searchQueries.map(q => q.query));
    const cacheHitRate = ((this.searchQueries.length - uniqueQueries.size) / this.searchQueries.length) * 100;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      fastestResponse,
      slowestResponse,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    };
  }

  public async generateReport(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    summary: SearchMetrics;
    details: {
      topQueries: Array<{query: string; count: number}>;
      contentTypeUsage: Record<string, number>;
      userActivity: Array<{userId: string; queryCount: number}>;
      performance: SearchMetrics['performanceMetrics'];
    };
    generatedAt: Date;
  }> {
    const report = {
      summary: this.getMetrics(),
      details: {
        topQueries: this.getTopQueries(20, timeRange),
        contentTypeUsage: this.getContentTypeDistribution(),
        userActivity: this.getUserActivity(),
        performance: this.getPerformanceMetrics(),
      },
      generatedAt: new Date(),
    };

    // Log report generation
    console.log('📊 Search analytics report generated:', report);

    return report;
  }

  public exportData(): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalQueries: this.searchQueries.length,
      searchQueries: this.searchQueries,
      metrics: this.getMetrics(),
      systemHealth: this.getSystemHealth(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  public clearData(olderThan?: number): void {
    if (olderThan) {
      const cutoff = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);
      this.searchQueries = this.searchQueries.filter(q => q.timestamp > cutoff);
    } else {
      this.searchQueries = [];
    }
    this.saveData();
    this.calculateMetrics();
  }

  // Private helper methods
  private loadData(): void {
    try {
      const storedQueries = localStorage.getItem(this.STORAGE_KEY);
      const storedMetrics = localStorage.getItem(this.METRICS_KEY);
      const storedHealth = localStorage.getItem(this.HEALTH_KEY);

      if (storedQueries) {
        const parsed = JSON.parse(storedQueries);
        this.searchQueries = parsed.map((q: any) => ({
          ...q,
          timestamp: new Date(q.timestamp)
        }));
      }

      if (storedMetrics) {
        this.metrics = JSON.parse(storedMetrics);
      }

      if (storedHealth) {
        const parsed = JSON.parse(storedHealth);
        this.systemHealth = {
          ...parsed,
          lastCheck: new Date(parsed.lastCheck)
        };
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.searchQueries));
      if (this.metrics) {
        localStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
      }
      if (this.systemHealth) {
        localStorage.setItem(this.HEALTH_KEY, JSON.stringify(this.systemHealth));
      }
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  private saveUserRecentSearch(userId: string, query: string): void {
    const historyKey = `user_search_history_${userId}`;
    const history = this.getUserSearchHistory(userId);

    // Remove duplicates and add new query
    const updatedHistory = [query, ...history.filter(q => q !== query)].slice(0, 20);

    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  }

  private calculateMetrics(): void {
    const totalQueries = this.searchQueries.length;
    const successfulQueries = this.searchQueries.filter(q => q.success).length;
    const failedQueries = totalQueries - successfulQueries;

    const successfulQueriesWithTime = this.searchQueries.filter(q => q.success && q.responseTime > 0);
    const averageResponseTime = successfulQueriesWithTime.length > 0
      ? successfulQueriesWithTime.reduce((sum, q) => sum + q.responseTime, 0) / successfulQueriesWithTime.length
      : 0;

    this.metrics = {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageResponseTime: Math.round(averageResponseTime),
      topQueries: this.getTopQueries().map(q => ({
        ...q,
        lastSearched: this.searchQueries.find(sq => sq.query === q.query)?.timestamp || new Date()
      })),
      contentTypeDistribution: this.getContentTypeDistribution(),
      hourlyDistribution: this.getHourlyDistribution(),
      userActivity: this.getUserActivity(),
      performanceMetrics: this.getPerformanceMetrics(),
    };

    this.saveData();
  }

  private updateMetrics(): void {
    // Debounced metrics calculation
    if (this.metrics) {
      clearTimeout(this.metricsCalculationTimeout);
      this.metricsCalculationTimeout = setTimeout(() => {
        this.calculateMetrics();
      }, 1000);
    }
  }

  private metricsCalculationTimeout: NodeJS.Timeout | null = null;

  private updateSystemHealth(): void {
    const now = new Date();
    const alerts: SystemHealth['alerts'] = [];

    // Check query performance
    const performance = this.getPerformanceMetrics();
    if (performance.errorRate > 5) {
      alerts.push({
        type: 'error',
        message: `High error rate detected: ${performance.errorRate}%`,
        timestamp: now,
      });
    }

    if (performance.averageResponseTime > 2000) {
      alerts.push({
        type: 'warning',
        message: `Slow average response time: ${performance.averageResponseTime}ms`,
        timestamp: now,
      });
    }

    // Check system status
    this.systemHealth = {
      status: this.getSystemStatus(),
      uptime: this.calculateUptime(),
      memoryUsage: this.estimateMemoryUsage(),
      cpuUsage: this.estimateCPUUsage(),
      activeConnections: this.searchQueries.filter(q =>
        (now.getTime() - q.timestamp.getTime()) < 5 * 60 * 1000
      ).length,
      apiStatus: this.checkAPIStatus(),
      lastCheck: now,
      alerts,
    };
  }

  private getSystemStatus(): SystemHealth['status'] {
    const performance = this.getPerformanceMetrics();

    if (performance.errorRate > 10 || performance.averageResponseTime > 5000) {
      return 'down';
    } else if (performance.errorRate > 5 || performance.averageResponseTime > 2000) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private calculateUptime(): number {
    // In a real implementation, this would track actual server uptime
    // For now, simulate based on recent query activity
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentQueries = this.searchQueries.filter(q => q.timestamp > fiveMinutesAgo);
    return recentQueries.length > 0 ? 99.9 : 95.0; // Simulated uptime percentage
  }

  private estimateMemoryUsage(): number {
    // Simulate memory usage based on stored data size
    try {
      const storageSize = JSON.stringify(this.searchQueries).length;
      // Rough estimate: 1KB per 10 queries
      return Math.min((storageSize / 10) * 1, 100);
    } catch {
      return 0;
    }
  }

  private estimateCPUUsage(): number {
    // Simulate CPU usage based on recent query frequency
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentQueries = this.searchQueries.filter(q => q.timestamp > oneMinuteAgo);
    return Math.min(recentQueries.length * 2, 100);
  }

  private checkAPIStatus(): Record<string, boolean> {
    return {
      search: true, // Would check actual search API health
      database: true, // Would check database connectivity
      cache: true, // Would check cache service
      notifications: true, // Would check notification service
    };
  }

  private startMonitoring(): void {
    // Update metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.updateSystemHealth();
    }, 30000);
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private generateId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('search_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('search_session_id', sessionId);
    }
    return sessionId;
  }

  // Cleanup method
  public destroy(): void {
    this.stopMonitoring();
    this.saveData();
  }
}

// Export singleton instance
export const searchAnalytics = new SearchAnalyticsService();

export default searchAnalytics;