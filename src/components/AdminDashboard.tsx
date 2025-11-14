import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  Users,
  Search,
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Mail,
  Shield,
  CreditCard,
  Clock,
  Calendar,
  UserCheck,
  Star,
  Crown,
  Zap,
  Bell,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  UserX,
  Refresh
} from 'lucide-react';
import AdminNotifications from './AdminNotifications';
import { adminNotifications } from '../services/adminNotificationService';
import { config } from '../config/envConfig';

interface AdminDashboardProps {
  onClose?: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'search' | 'subscriptions' | 'payments' | 'analytics' | 'settings'>('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState({
    maintenance: false,
    demoMode: false,
    rateLimits: {
      free: 10,
      pro: 100,
      ultra: 500,
    },
  });

  // Mock data (in real app, this would come from API)
  const mockUsers = [
    {
      id: '1',
      email: 'admin@searchcenter.com',
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      avatar: '/api/placeholder/avatar1.jpg',
      subscription: {
        tier: 'ultra',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2025-01-01',
      },
      ranking: {
        level: 8,
        points: 1250,
        reputation: 892,
        badges: [
          { id: 'expert', name: 'Expert User', icon: '👑', requirement: 1000, earned: true },
          { id: 'power_user', name: 'Power User', icon: '⚡', requirement: 500, earned: true },
          { id: 'search_master', name: 'Search Master', icon: '🔍', requirement: 2000, earned: true },
          { id: 'contributor', name: 'Contributor', icon: '💪', requirement: 50, earned: true },
        ],
      },
    },
    {
      id: '2',
      email: 'user@searchcenter.com',
      firstName: 'Power',
      lastName: 'User',
      username: 'poweruser',
      avatar: '/api/placeholder/avatar2.jpg',
      subscription: {
        tier: 'pro',
        status: 'active',
        startDate: '2024-03-15',
        endDate: '2024-03-15',
      },
      ranking: {
        level: 5,
        points: 750,
        reputation: 456,
        badges: [
          { id: 'premium_user', name: 'Premium User', icon: '🌟', requirement: 100, earned: true },
          { id: 'monthly_champion', name: 'Monthly Champion', icon: '🏆', requirement: 25, earned: true },
        ],
      },
    },
    {
      id: '3',
      email: 'developer@searchcenter.com',
      firstName: 'Dev',
      lastName: 'User',
      username: 'devuser',
      avatar: '/api/placeholder/avatar3.jpg',
      subscription: {
        tier: 'free',
        status: 'active',
        startDate: '2024-02-01',
      },
      ranking: {
        level: 3,
        points: 150,
        reputation: 89,
        badges: [],
      },
    },
  ];

  useEffect(() => {
    // Load initial data
    setUsers(mockUsers);
    setSubscriptions([
      {
        id: 'sub1',
        userId: '1',
        tier: 'pro',
        status: 'active',
        startDate: '2024-01-01',
        nextBillingDate: '2024-02-01',
        price: 399,
        features: {
          searchLimit: 1000,
          aiProjects: 20,
          advancedFilters: true,
          apiAccess: true,
        prioritySupport: true,
        },
      },
      {
        id: 'sub2',
        userId: '2',
        tier: 'ultra',
        status: 'active',
        startDate: '2024-01-15',
        nextBillingDate: '2025-01-15',
        price: 999,
        features: {
          searchLimit: 1000,
          aiProjects: 100,
          advancedFilters: true,
          customThemes: true,
          prioritySupport: true,
          unlimitedHistory: true,
          apiAccess: true,
        },
      },
      {
        id: 'sub3',
        userId: '3',
        tier: 'free',
        status: 'cancelled',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        price: 0,
      },
    },
    ]);
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleUserAction = (action: 'view' | 'edit' | 'suspend' | 'delete' | 'reset', user: any) => {
    setShowConfirmModal(true);
    setConfirmAction(action);
    setSelectedUser(user);
  };

  const confirmUserAction = () => {
    // Simulate user action
    console.log(`User ${confirmAction}: ${selectedUser.email}`);

    // In real app, this would call the actual API
    setUsers(prevUsers.map(u =>
      u.id === selectedUser.id ? { ...u, ...selectedUser } : u
    ));

    if (confirmAction === 'delete') {
      setUsers(prevUsers.filter(u => u.id !== selectedUser.id));
    }

    setShowConfirmModal(false);
    setSelectedUser(null);
    setConfirmAction('');
  };

  const handleSubscriptionAction = (action: 'create' | 'cancel' | 'refund' | 'extend', subscription: any) => {
    console.log(`Subscription ${action}:`, subscription);

    // In real app, this would call the subscription service
    if (action === 'cancel') {
      setSubscriptions(prevSubs.map(sub =>
        sub.id === subscription.id ? { ...sub, status: 'cancelled' } : sub
      ));
    }

    setShowConfirmModal(false);
    setConfirmAction('');
  };

  const handleNotificationAction = (type: 'success' | 'error' | 'warning' | 'info', title?: string, message?: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      title: title || 'Notification',
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setShowNotificationModal(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.read = true;
    }, 5000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-700';
      case 'pro': return 'bg-blue-100 text-blue-700';
      case 'ultra': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      case 'expired': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const filteredUsers = (query: string) => {
    if (!query) return users;
    return users.filter(user =>
      user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.username?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredSubscriptions = () => {
    switch (activeTab) {
      case 'all': return subscriptions;
      case 'active': return subscriptions.filter(sub => sub.status === 'active');
      case 'cancelled': return subscriptions.filter(sub => sub.status === 'cancelled');
      case 'expired': return subscriptions.filter(sub => sub.status === 'expired');
      default: return subscriptions;
    }
  };

  const mockAnalytics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.subscription.status === 'active').length,
    totalSubscriptions: {
      free: subscriptions.filter(s => s.tier === 'free').length,
      pro: subscriptions.filter(s => s.tier === 'pro').length,
      ultra: subscriptions.filter(s => s.tier === 'ultra').length,
    },
    totalRevenue: mockSubscriptions.reduce((total, sub) => {
      if (sub.status === 'active') {
        const monthlyPrice = sub.price / 12;
        return total + (monthlyPrice * 30);
      }
      return total;
    },
    todayNewUsers: 12,
    todaySearchQueries: 342,
    todayRevenue: 8560,
    todaySignups: 8,
    topSearchQueries: ['react tutorial', 'python course', 'AI project builder'],
    topResources: ['github.com/facebook/react', 'kaggle/titanic', 'arxiv.org/llm'],
  };

  const mockPayments = [
    {
      id: '1',
      userId: '1',
      amount: 399,
      currency: 'INR',
      type: 'subscription',
      subscriptionId: 'sub1',
      status: 'success',
      date: '2024-01-01',
      },
    {
      id: '2',
      userId: '2',
      amount: 999,
      currency: 'INR',
      type: 'subscription',
      subscriptionId: 'sub2',
      status: 'success',
      date: '2024-01-15',
    },
    ];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-screen overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LayoutDashboard className="h-6 w-6 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <div className="text-purple-100 text-sm">SearchCenter Live</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className="relative p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {showNotificationModal && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </div>

              <div className="flex items-center">
                <div className="text-white text-sm">
                  Welcome back, <span className="font-semibold">{user.firstName}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // In real app, this would handle Clerk logout
                  console.log('Admin logout');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Logout
              </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-black bg-opacity-10 rounded-lg p-1 mb-6">
            {['overview', 'users', 'search', 'subscriptions', 'payments', 'analytics', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-purple-700'
                }`}
              >
                {tab === 'overview' && <LayoutDashboard className="h-4 w-4 mr-2" />}
                {tab === 'users' && <Users className="h-4 w-4 mr-2" />}
                {tab === 'search' && <Search className="h-4 w-4 mr-2" />}
                {tab === 'subscriptions' && <CreditCard className="h-4 w-4 mr-2" />}
                {tab === 'payments' && <DollarSign className="h-4 w-4 mr-2" />}
                {tab === 'analytics' && <BarChart3 className="h-4 w-4 mr-2" />}
                {tab === 'settings' && <Settings className="h-4 w-4 mr-2" />}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-gray-600" />
              <div className="text-2xl font-bold text-gray-900">Total Users</div>
              <div className="text-3xl font-bold text-purple-600">{mockAnalytics.totalUsers}</div>
            </div>
            <div className="text-sm text-gray-500">+12 this month</div>
          </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="text-gray-600" />
              <div className="text-2xl font-bold text-green-600">{mockAnalytics.activeUsers}</div>
              <div className="text-sm text-gray-500">+2 this week</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <DollarSign className="text-gray-600" />
              <div className="text-2xl font-bold text-blue-600">₹{mockAnalytics.totalRevenue.toLocaleString('en-IN')}</div>
              <div className="text-sm text-gray-500">This month</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <Search className="text-gray-600" />
              <div className="text-2xl font-bold text-orange-600">{mockAnalytics.todaySearchQueries}</div>
              <div className="text-sm text-gray-500">Queries today</div>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <Activity className="text-gray-600" />
              <div className="text-2xl font-bold text-purple-600">{mockAnalytics.todaySignups}</div>
              <div className="text-sm text-gray-500">Signups today</div>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <BarChart3 className="text-gray-600" />
              <div className="text-2xl font-bold text-blue-600">Search Trends</div>
              <div className="text-sm text-gray-500">Last 30 days</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

        {/* Main Content */}
        <div className="flex-1 gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 w-full md:w-80">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-4">
                <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Zap className="h-5 w-5 mr-2" />
                  <span>Send Notification</span>
                </button>
                <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="h-5 w-5 mr-2" />
                  <span>Export Data</span>
                </button>
                <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  <Shield className="h-5 w-5 mr-2" />
                  <span>Maintenance Mode</span>
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-2">System Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Maintenance Mode</span>
                    <div className="relative">
                      <button
                        onClick={() => setSystemSettings(prev => ({ ...prev, maintenance: !systemSettings.maintenance }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          !systemSettings.maintenance
                            ? 'bg-gray-200 hover:bg-gray-300'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {systemSettings.maintenance ? (
                          <div className="text-red-600 font-medium">ON</div>
                        ) : (
                          <div className="text-green-600 font-medium">OFF</div>
                        )}
                      </div>
                    </button>
                    <div className="ml-3 text-sm text-gray-500">
                      Disable features temporarily
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Demo Mode</span>
                    <div className="relative">
                      <button
                        onClick={() => setSystemSettings(prev => ({ ...prev, demoMode: !systemSettings.demoMode }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          !systemSettings.demoMode
                            ? 'bg-gray-200 hover:bg-gray-300'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {systemSettings.demoMode ? (
                          <div className="text-red-600 font-medium">ON</div>
                        ) : (
                          <div className="text-green-600 font-medium">OFF</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Rate Limits</span>
                    <select
                      value={systemSettings.rateLimits.free.toString()}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, rateLimits: { ...prev.rateLimits, free: parseInt(e.target.value) } }))}
                      className="ml-3 text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="10">10 requests/min</option>
                      <option value="50">50 requests/min</option>
                      <option value="100">100 requests/min</option>
                      <option value="500">500 requests/min</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900">About Platform</h4>
                <div className="text-sm text-gray-600 text-left">
                  <div>SearchCenter Live v1.0.0</div>
                  <div>Total Users: {mockAnalytics.totalUsers}</div>
                  <div>Active Now: {mockAnalytics.activeUsers}</div>
                  <div>Revenue This Month: ₹{mockAnalytics.totalRevenue.toLocaleString('en-IN')}</div>
                  <div>Today's Searches: {mockAnalytics.todaySearchQueries}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex-col md:flex-row gap-6">
            {activeTab === 'overview' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">User Statistics</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">Total: {mockAnalytics.totalUsers}</div>
                      <div className="text-gray-700">Free: {mockAnalytics.totalUsers - mockAnalytics.activeUsers}</div>
                      <div className="text-gray-700">Pro: {mockAnalytics.activeUsers}</div>
                      <div className="text-gray-700">Ultra: {mockAnalytics.totalUsers - mockAnalytics.activeUsers}</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Subscription Revenue</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">Free: ₹0</div>
                      <div className="text-gray-700">Pro: ₹15,680</div>
                      <div className="text-gray-700">Ultra: ₹29,970</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Active Today</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">Free: {mockAnalytics.activeUsers}</div>
                      <div className="text-gray-700">Pro: {mockAnalytics.activeUsers}</div>
                      <div className="text-gray-700">Ultra: {mockAnalytics.activeUsers}</div>
                    </div>
                  </div>

                  <div className="text-2xl font-bold mb-2">Growth Metrics</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">User Growth: +{mockAnalytics.activeUsers - mockAnalytics.totalUsers}</div></div>
                      <div className="text-gray-700">Churn Rate: 2.1%</div>
                    <div className="text-gray-700">New Signups: {mockAnalytics.todaySignups}</div>
                    </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-400 to-orange-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Top Resources</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">Code: github.com/react</div>
                      <div className="text-gray-700">Videos: youtube.com/tutorials</div>
                      <div className="text-gray-700">Datasets: kaggle.com/competitions</div>
                      <div className="text-gray-700">Papers: arxiv.org/llm</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">User Management</h2>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      // In real app, this would fetch and update users
                      console.log('Searching users for:', searchQuery);
                    }}
                    className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    <span>Search</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Users List</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-4 py-2 text-left text-sm font-medium">User</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Tier</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Joined</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers(user => user.email).slice(0, 10).map((user, index) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-100"
                            onClick={() => handleUserAction('view', user)}
                          >
                              <td className="px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center">
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  </div>
                                <td>
                                  <div className="font-medium text-gray-900">{user.firstName}</div>
                                  <div className="text-sm text-gray-600">{user.email}</div>
                                </td>
                                <td className="text-sm text-gray-600">{getTierColor(user.subscription.tier)}</td>
                              </td>
                              <td>
                                <div className="text-sm text-gray-600">{new Date(user.subscription.startDate).toLocaleDateString()}</td>
                              </td>
                              <td className="text-sm">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleUserAction('edit', user)}
                                    className="p-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                  </button>
                                </div>
                                <div>
                                  <button
                                    onClick={() => handleUserAction('suspend', user)}
                                    className="p-1 px-2 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                  >
                                    <UserX className="h-3 w-3" />
                                    </button>
                                </div>
                              </div>
                            </td>
                            <td className="text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleUserAction('delete', user)}
                                  className="p-1 px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Search Analytics</h2>

              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Top Queries Today</div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">1. "react tutorial"</div>
                      <div className="text-xs text-gray-500">234 searches</div>
                    </div>
                      <div className="text-sm text-gray-500">2. "python course"</div>
                      <div className="text-xs text-gray-500">189 searches</div>
                      <div className="text-xs text-gray-500">3. "AI project builder"</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Resource Categories</div>
                    <div className="space-y-2">
                      <div className="text-gray-700">Code: 45%</div>
                      <div className="text-gray-700">Videos: 30%</div>
                      <div className="text-gray-700">Datasets: 15%</div>
                      <div className="text-gray-700">Papers: 10%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Search Performance</h3>
                    <div className="space-y-4">
                      <div className="text-gray-700">Avg Response Time: 1.2s</div>
                      <div className="text-gray-700">Success Rate: 98.5%</div>
                      <div className="text-gray-700">Error Rate: 1.5%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Management</h2>

                <div className="mb-4">
                  <div className="text-gray-600 mb-4">
                    <span className="text-2xl font-bold">{filteredSubscriptions().length}</span> Subscriptions</span>
                  </div>
                  <button
                    onClick={() => {
                      setSystemSettings(prev => ({ ...prev, maintenance: !systemSettings.maintenance }));
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="text-white font-medium">Toggle Maintenance</span>
                    </button>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription Revenue</h3>
                    <div className="text-2xl font-bold text-gray-900">MRR: ₹{mockAnalytics.totalRevenue.toLocaleString('en-IN')}</div>
                    <div className="text-sm text-gray-600">This Month: ₹{mockSubscriptions.reduce((sum, sub) =>
                      sub.status === 'active' ? sum + (sub.price / 12) : sum
                    ).toLocaleString('en-IN')
                    }</div>
                  </div>
                </div>
              </div>

                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Payment History</h3>
                    <div className="text-gray-600 mb-4">
                      <div className="text-2xl font-bold">{mockPayments.length}</div> Transactions</div>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Today's Revenue</div>
                    <div className="text-3xl font-bold text-gray-900">₹{mockPayments.filter(p => p.date === new Date().toDateString()).reduce((sum, payment) => sum + payment.amount).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">This Month</div>
                    <div className="text-gray-600">Pro: ₹{mockPayments.filter(p => p.tier === 'pro').reduce((sum, payment) => sum + (payment.amount / 12)).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-gray-600">Ultra: ₹{mockPayments.filter(p => p.tier === 'ultra').reduce((sum, payment) => sum + (payment.amount / 12)).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Payment Methods</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Razorpay: 85%</span>
                        <span className="text-gray-500">Stripe: 15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Analytics</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:greg-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">User Activity</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">Daily Active: {mockAnalytics.activeUsers}</div>
                      <div className="text-gray-700">Peak Concurrent: 127</div>
                      <div className="text-gray-700">Avg Session: 12m</div>
                    </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Content Performance</div>
                    <div className="space-y-4">
                      <div className="text-gray-700">Search Success: 98.5%</div>
                      <div className="text-gray-700">API Response: 150ms</div>
                      <div className="text-gray-700">Cache Hit Rate: 94%</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6">
                    <div className="text-2xl font-bold mb-2">Error Tracking</div>
                    <div className="text-gray-700">Error Rate: 0.5%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto my-8"
            >
              <div className="bg-white rounded-t-2xl">
                <div className="p-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
                      {selectedUser.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.firstName}
                          className="w-24 h-24 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCheck className="h-24 w-24 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    </div>

                    <div className="text-sm text-gray-500 mb-4">Level {selectedUser.ranking.level}</p>
                    <div className="text-sm text-gray-500">Points: {selectedUser.ranking.points}</div>
                    <div className="text-sm text-gray-500">Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="text-sm text-gray-500">Reputation: {selectedUser.ranking.reputation}</div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-700">Status: {getStatusColor(selectedUser.subscription.status)}</div>
                      </div>
                      <div className="text-sm text-gray-500">Tier: {selectedUser.subscription.tier}</div>
                    </div>
                  </div>

                    <div className="mt-6">
                      <div className="text-sm text-gray-500">Actions</div>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => handleUserAction('view', selectedUser)}
                          className="flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                          <Eye className="h-4 w-4 mr-2" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => handleUserAction('edit', selectedUser)}
                          className="flex-1 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                          <Edit className="h-4 w-4 mr-2" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleUserAction('reset', selectedUser)}
                          className="flex-1 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            <Refresh className="h-4 w-4 mr-2" />
                          <span>Reset</span>
                        </button>
                        </button>
                      </div>

                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            setShowConfirmModal(true);
                            setConfirmAction('delete');
                          }}
                          className="flex-1 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Delete User</span>
                        </button>
                      </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    {confirmAction === 'delete' ? (
                      <div className="flex items-center">
                        <div className="mr-3">
                          <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                          <div>
                            <p className="font-medium">Are you sure?</p>
                            <p className="text-sm text-gray-700">This action cannot be undone.</p>
                          </div>

                          <div className="mt-4 space-x-2">
                            <button
                              onClick={() => {
                                handleUserAction('delete', selectedUser);
                                setShowUserModal(false);
                                setShowConfirmModal(false);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => {
                                setShowUserModal(false);
                                setConfirmModal(false);
                              }}
                              <No, Cancel
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={() => {
                            setShowConfirmModal(false);
                            setConfirmAction('');
                            setSelectedUser(null);
                            setShowUserModal(false);
                          }}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </button>
                      </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-4"
            >
              <div className="p-6">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-lg font-medium text-gray-900 mb-4">Notification</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-6">
                <div className="text-center mb-6">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <div className="text-xl font-bold text-gray-900 mb-4">
                    {confirmAction === 'delete' ? (
                      <div>
                        <p className="font-medium text-red-600">
                          <p>Delete "{confirmAction === 'delete' ? selectedUser?.firstName : 'this user'}</p>?</p>
                        </p>
                      </div>
                    ) : confirmAction === 'suspend' ? (
                      <div>
                        <p className="font-medium text-orange-600">
                          Suspend "{selectedUser?.firstName}"?</p>
                        </div>
                    ) : confirmAction === 'reset' ? (
                      <div>
                        <p className="font-medium text-blue-600">Reset "{selectedUser?.firstName}"?</p>
                        </p>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-700">Cancel</p>
                        </p>
                    )}
                  </div>
                  </div>
                </motion.div>
                <motion.div>
                  <div className="flex justify-center mt-4 space-x-4">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setShowConfirmModal(false);
                        setConfirmAction('');
                        setSelectedUser(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setSelectedUser(null);
                      setShowUserModal(false);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </button>
                </div>
              </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        )}
      </AnimatePresence>

      {/* System Settings Modal */}
      <AnimatePresence>
        {systemSettings.maintenance && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-hidden p-6"
            >
              <div className="p-6">
                <AlertTriangle className="h-8 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-yellow-600 mb-4">Maintenance Mode</h3>
                <p className="text-gray-700 mb-2">
                  Platform will be in maintenance mode for a few hours
                </p>
              </div>

                <div className="mt-6">
                  <button
                    onClick={() => setSystemSettings(prev => ({ ...prev, maintenance: !systemSettings.maintenance }))}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <End Maintenance
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  During maintenance:
                    <ul className="space-y-2">
                      <li>Search and browsing will be temporarily disabled</li>
                      <li>User authentication will remain active</li>
                      <li>Admins will receive maintenance notifications</li>
                      <li>All API responses will return 503 Service Unavailable</li>
                    <li>Real-time data updates will be paused</li>
                    </ul>
                  </div>

                <div className="mt-4">
                  <button
                    onClick={() => setSystemSettings(prev => ({ ...prev, maintenance: !systemSettings.maintenance }))}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Resume Operations
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        )}
      </AnimatePresence>
      )}
      </div>
    </div>
  );
}