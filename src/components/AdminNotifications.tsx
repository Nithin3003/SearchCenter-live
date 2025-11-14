import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Shield,
  Activity,
  Zap,
  X,
  Filter,
  Search,
  Trash2,
  Download,
  Settings
} from 'lucide-react';
import { adminNotifications, AdminNotification } from '../services/adminNotificationService';
import { config } from '../config/envConfig';

interface AdminNotificationsProps {
  className?: string;
}

export default function AdminNotifications({ className = '' }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<'all' | AdminNotification['type']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AdminNotification['priority']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadNotifications();
    listenForNewNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const notifs = adminNotifications.getNotifications();
    setNotifications(notifs);
  };

  const listenForNewNotifications = () => {
    const handleNotification = (event: CustomEvent) => {
      loadNotifications();

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(event.detail.notification.title, {
          body: event.detail.notification.message,
          icon: '/favicon.ico'
        });
      }
    };

    window.addEventListener('adminNotification', handleNotification as EventListener);
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getPriorityIcon = (priority: AdminNotification['priority']) => {
    switch (priority) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-blue-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getTypeIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'user_action': return <User className="h-4 w-4 text-blue-600" />;
      case 'system_alert': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'security': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'performance': return <Activity className="h-4 w-4 text-orange-600" />;
      case 'feature_usage': return <Zap className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: AdminNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-green-500 bg-green-50';
    }
  };

  const getNotificationStats = () => {
    return adminNotifications.getNotificationStats();
  };

  const handleClearAll = () => {
    adminNotifications.clearNotifications();
    loadNotifications();
  };

  const handleExport = () => {
    const data = adminNotifications.exportNotifications();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-notifications-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestNotification = async () => {
    await adminNotifications.sendTestNotification();
    loadNotifications();
  };

  const filteredNotifications = getFilteredNotifications();
  const stats = getNotificationStats();
  const unreadCount = adminNotifications.getUnreadNotifications().length;

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Notifications</h2>
            <p className="text-sm text-gray-500">
              {config.getAdminConfig().email}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200"
          >
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.byPriority.critical || 0}</div>
                <div className="text-sm text-gray-500">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.byPriority.high || 0}</div>
                <div className="text-sm text-gray-500">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
                <div className="text-sm text-gray-500">Last 24h</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="user_action">User Actions</option>
                <option value="system_alert">System Alerts</option>
                <option value="payment">Payments</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
                <option value="feature_usage">Feature Usage</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Test Notification
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>

              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`border-l-4 ${getPriorityColor(notification.priority)}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(notification.priority)}
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.timestamp.toLocaleString()}
                          </span>
                          {notification.userEmail && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {notification.userEmail}
                            </span>
                          )}
                          {notification.requiresAction && (
                            <span className="flex items-center text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Action Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}