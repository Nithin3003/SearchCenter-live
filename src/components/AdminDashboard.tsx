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
import AnalyticsDashboard from './AnalyticsDashboard';
import ServiceIntegrationTester from './ServiceIntegrationTester';
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

  // Check if current user is admin
  const isAdmin = user ? config.isAdmin(user.emailAddresses?.[0]?.emailAddress || '') : false;

  useEffect(() => {
    if (!isAdmin) {
      console.warn('Access denied: User is not admin');
      if (onClose) onClose();
      return;
    }

    // Load initial data
    loadMockData();
  }, [isAdmin]);

  const loadMockData = () => {
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
    ]);

    setPayments([
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
    ]);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleUserAction = (action: 'view' | 'edit' | 'suspend' | 'delete' | 'reset', userData: any) => {
    setSelectedUser(userData);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const confirmUserAction = async () => {
    try {
      console.log(`User ${confirmAction}: ${selectedUser.email}`);

      // Send admin notification
      if (confirmAction === 'delete') {
        await adminNotifications.notifySuspiciousActivity({
          activity: `Admin deleted user: ${selectedUser.email}`,
          userId: selectedUser.id,
          details: `User ${selectedUser.firstName} ${selectedUser.lastName} was deleted by admin ${user?.firstName}`,
          timestamp: new Date().toISOString()
        });
        setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
      } else if (confirmAction === 'suspend') {
        await adminNotifications.notifySuspiciousActivity({
          activity: `Admin suspended user: ${selectedUser.email}`,
          userId: selectedUser.id,
          details: `User ${selectedUser.firstName} ${selectedUser.lastName} was suspended by admin ${user?.firstName}`,
          timestamp: new Date().toISOString()
        });
        setUsers(prevUsers.map(u =>
          u.id === selectedUser.id ? { ...u, subscription: { ...u.subscription, status: 'suspended' } } : u
        ));
      }

      setShowConfirmModal(false);
      setSelectedUser(null);
      setConfirmAction('');
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
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
      case 'suspended': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredUsers = () => {
    if (!searchQuery) return users;
    return users.filter(user =>
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const mockAnalytics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.subscription.status === 'active').length,
    totalSubscriptions: {
      free: subscriptions.filter(s => s.tier === 'free').length,
      pro: subscriptions.filter(s => s.tier === 'pro').length,
      ultra: subscriptions.filter(s => s.tier === 'ultra').length,
    },
    totalRevenue: subscriptions.reduce((total, sub) => {
      if (sub.status === 'active') {
        const monthlyPrice = sub.price / 12;
        return total + (monthlyPrice * 30);
      }
      return total;
    }, 0),
    todayNewUsers: 12,
    todaySearchQueries: 342,
    todayRevenue: 8560,
    todaySignups: 8,
    topSearchQueries: ['react tutorial', 'python course', 'AI project builder'],
    topResources: ['github.com/facebook/react', 'kaggle/titanic', 'arxiv.org/llm'],
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-auto text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-screen overflow-hidden flex flex-col">
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
              <div className="text-white text-sm">
                Welcome back, <span className="font-semibold">{user?.firstName}</span>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-black bg-opacity-10 rounded-lg p-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
              { id: 'payments', label: 'Payments', icon: DollarSign },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-purple-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-xs text-green-600">+12</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{mockAnalytics.totalUsers}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="h-5 w-5 text-gray-600" />
                <span className="text-xs text-green-600">+2</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{mockAnalytics.activeUsers}</div>
              <div className="text-sm text-gray-500">Active Users</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <span className="text-xs text-green-600">+8%</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">₹{mockAnalytics.totalRevenue.toLocaleString('en-IN')}</div>
              <div className="text-sm text-gray-500">Monthly Revenue</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Search className="h-5 w-5 text-gray-600" />
                <span className="text-xs text-orange-600">+15%</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{mockAnalytics.todaySearchQueries}</div>
              <div className="text-sm text-gray-500">Today's Searches</div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdminNotifications />

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => adminNotifications.sendTestNotification()}
                      className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Test Notification
                    </button>
                    <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </button>
                    <button
                      onClick={() => setSystemSettings(prev => ({ ...prev, maintenance: !systemSettings.maintenance }))}
                      className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {systemSettings.maintenance ? 'End Maintenance' : 'Start Maintenance'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers().map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserCheck className="h-6 w-6 text-gray-400" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(user.subscription.tier)}`}>
                                {user.subscription.tier}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${getStatusColor(user.subscription.status)}`}>
                                {user.subscription.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.subscription.startDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleUserAction('view', user)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('edit', user)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('suspend', user)}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('delete', user)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Search Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Queries Today</h3>
                    <div className="space-y-2">
                      {mockAnalytics.topSearchQueries.map((query, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm text-gray-600">{index + 1}. {query}</span>
                          <span className="text-xs text-gray-500">{Math.floor(Math.random() * 500) + 100} searches</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Subscription Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly Revenue</span>
                        <span className="text-lg font-bold text-blue-600">₹{mockAnalytics.totalRevenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Subscriptions</span>
                        <span className="text-lg font-bold text-green-600">{mockAnalytics.activeUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment History</h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{payment.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User {payment.userId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{payment.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <ServiceIntegrationTester />

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">System Settings</h2>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Maintenance Mode</h3>
                          <p className="text-sm text-gray-500">Temporarily disable platform features</p>
                        </div>
                        <button
                          onClick={() => setSystemSettings(prev => ({ ...prev, maintenance: !systemSettings.maintenance }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            systemSettings.maintenance ? 'bg-red-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            systemSettings.maintenance ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm {confirmAction}?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to {confirmAction} "{selectedUser.firstName} {selectedUser.lastName}"? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={confirmUserAction}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Yes, {confirmAction}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedUser(null);
                      setConfirmAction('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}