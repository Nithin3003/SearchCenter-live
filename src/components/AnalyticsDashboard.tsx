import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Search,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Refresh,
  Download,
  Filter,
  Calendar,
  Eye,
  Target,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { searchAnalytics, SearchMetrics, SystemHealth } from '../services/searchAnalyticsService';

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'queries' | 'performance' | 'users' | 'system'>('queries');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setMetrics(searchAnalytics.getMetrics());
      setSystemHealth(searchAnalytics.getSystemHealth());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAnalytics();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const data = searchAnalytics.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5" />;
      case 'down': return <WifiOff className="h-5 w-5" />;
    }
  };

  const getPerformanceColor = (value: number, type: 'response' | 'error' | 'cache') => {
    switch (type) {
      case 'response':
        if (value < 500) return 'text-green-600';
        if (value < 1000) return 'text-yellow-600';
        return 'text-red-600';
      case 'error':
        if (value < 1) return 'text-green-600';
        if (value < 5) return 'text-yellow-600';
        return 'text-red-600';
      case 'cache':
        if (value > 80) return 'text-green-600';
        if (value > 60) return 'text-yellow-600';
        return 'text-red-600';
    }
  };

  if (!metrics || !systemHealth) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <Refresh className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Search Analytics</h2>
              <p className="text-sm text-gray-500">Real-time monitoring and performance metrics</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { value: 'day', label: '24h' },
                { value: 'week', label: '7d' },
                { value: 'month', label: '30d' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Refresh className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`bg-gray-50 rounded-xl p-4 border-l-4 ${
            systemHealth.status === 'healthy' ? 'border-green-500' :
            systemHealth.status === 'degraded' ? 'border-yellow-500' : 'border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">System Status</span>
              <span className={getStatusColor(systemHealth.status)}>
                {getStatusIcon(systemHealth.status)}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 capitalize">{systemHealth.status}</div>
            <div className="text-sm text-gray-500">Uptime: {systemHealth.uptime.toFixed(1)}%</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Users</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{systemHealth.activeConnections}</div>
            <div className="text-sm text-gray-500">Currently online</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              <Database className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{systemHealth.memoryUsage.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${systemHealth.memoryUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Response Time</span>
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{metrics.performanceMetrics.averageResponseTime}ms</div>
            <div className={`text-sm ${getPerformanceColor(metrics.performanceMetrics.averageResponseTime, 'response')}`}>
              {metrics.averageResponseTime < 500 ? 'Excellent' : metrics.averageResponseTime < 1000 ? 'Good' : 'Needs Attention'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Search className="h-5 w-5" />
              <span className="text-sm opacity-90">Total Queries</span>
            </div>
            <div className="text-3xl font-bold">{metrics.totalQueries.toLocaleString()}</div>
            <div className="text-sm opacity-90">Last {timeRange === 'day' ? '24 hours' : timeRange === 'week' ? '7 days' : '30 days'}</div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm opacity-90">Success Rate</span>
            </div>
            <div className="text-3xl font-bold">
              {((metrics.successfulQueries / metrics.totalQueries) * 100).toFixed(1)}%
            </div>
            <div className="text-sm opacity-90">{metrics.successfulQueries} successful</div>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm opacity-90">Avg Response</span>
            </div>
            <div className="text-3xl font-bold">{metrics.averageResponseTime}ms</div>
            <div className="text-sm opacity-90">
              Fast: {metrics.performanceMetrics.fastestResponse}ms
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm opacity-90">Error Rate</span>
            </div>
            <div className="text-3xl font-bold">
              {((metrics.failedQueries / metrics.totalQueries) * 100).toFixed(1)}%
            </div>
            <div className="text-sm opacity-90">{metrics.failedQueries} failed</div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Queries */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Top Search Queries
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {metrics.topQueries.slice(0, 10).map((query, index) => (
                  <div key={query.query} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                      <span className="text-sm text-gray-900 font-medium">{query.query}</span>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {query.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Type Distribution */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-green-600" />
                Content Type Distribution
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(metrics.contentTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-4 mr-3">
                        <div
                          className="h-4 rounded-full bg-blue-600"
                          style={{ width: `${(count / metrics.totalQueries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                User Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {metrics.userActivity.slice(0, 8).map((user) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">User {user.userId}</span>
                      <div className="text-xs text-gray-500">
                        Last active: {user.lastActive.toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {user.queryCount} queries
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-orange-600" />
                Performance Metrics
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Cache Hit Rate</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(metrics.performanceMetrics.cacheHitRate, 'cache')}`}>
                    {metrics.performanceMetrics.cacheHitRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Error Rate</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(metrics.performanceMetrics.errorRate, 'error')}`}>
                    {metrics.performanceMetrics.errorRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Fastest Response</span>
                  <span className="text-sm font-bold text-green-600">
                    {metrics.performanceMetrics.fastestResponse}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Slowest Response</span>
                  <span className="text-sm font-bold text-red-600">
                    {metrics.performanceMetrics.slowestResponse}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Service Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemHealth.apiStatus).map(([service, isHealthy]) => (
              <div key={service} className="flex items-center justify-between bg-white rounded-lg p-3">
                <span className="text-sm font-medium text-gray-700 capitalize">{service}</span>
                <div className={`flex items-center ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                  {isHealthy ? (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 mr-2" />
                      Offline
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        {systemHealth.alerts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Recent System Alerts
            </h3>
            <div className="space-y-2">
              {systemHealth.alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center">
                    <AlertTriangle className={`h-4 w-4 mr-2 ${
                      alert.type === 'error' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <span className="text-sm text-gray-900">{alert.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}