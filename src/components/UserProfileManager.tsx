import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Mail,
  Globe,
  Link2,
  Github,
  Twitter,
  Upload,
  Edit2,
  Save,
  X,
  Check,
  AlertCircle,
  Star,
  TrendingUp,
  Award,
  Calendar,
  Shield,
  Camera,
  MapPin,
  Briefcase,
  Database
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { userService, UserProfile, UserPreferences } from '../services/userService';

interface UserProfileManagerProps {
  onClose?: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export default function UserProfileManager({ onClose, onProfileUpdate }: UserProfileManagerProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'subscription' | 'ranking'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const [profileData, preferencesData] = await Promise.all([
        userService.getUserProfile(user.id),
        userService.getUserPreferences(user.id),
      ]);

      setProfile(profileData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await userService.updateUserProfile(user.id, editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      onProfileUpdate?.(updatedProfile);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const updatedPreferences = await userService.updateUserPreferences(user.id, newPreferences);
      setPreferences(updatedPreferences);
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to save preferences. Please try again.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Avatar must be less than 5MB');
      return;
    }

    setIsSaving(true);
    try {
      const avatarUrl = await userService.uploadAvatar(user.id, file);
      setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      setSuccessMessage('Avatar updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to upload avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        bio: profile.bio,
        website: profile.website,
        location: profile.location,
        skills: profile.skills,
        socialLinks: profile.socialLinks,
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
    setErrorMessage(null);
  };

  const getUserRankingDisplay = () => {
    if (!profile?.ranking) return null;

    const { level, points, nextLevelPoints, reputation, contributions } = profile.ranking;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-900">Current Level</h4>
            <div className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">Level {level}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Experience Points</span>
              <span className="font-semibold text-gray-900">{points.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((points % nextLevelPoints) / nextLevelPoints * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-600">
              {nextLevelPoints - points} points to Level {level + 1}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center mb-3">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              <h4 className="font-semibold text-gray-900">Contributions</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">{contributions}</div>
            <div className="text-sm text-gray-600">Total contributions</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              <h4 className="font-semibold text-gray-900">Reputation</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">{reputation}</div>
            <div className="text-sm text-gray-600">Community reputation</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-screen overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center">
            <User className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">User Profile</h2>
              <p className="text-purple-100">Manage your account settings and preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:text-purple-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['profile', 'preferences', 'subscription', 'ranking'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Success/Error Messages */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center"
              >
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-700">{successMessage}</span>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
              >
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" />
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-gray-600">{profile.emailAddresses?.[0]?.emailAddress}</p>
                  {profile.username && (
                    <p className="text-gray-500 text-sm">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* Editable Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.firstName || ''}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                        {profile.firstName || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.lastName || ''}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                        {profile.lastName || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.username || ''}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                        {profile.username || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg min-h-20">
                        {profile.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                        {profile.website ? (
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {profile.website}
                            <Link2 className="h-4 w-4 ml-2" />
                          </a>
                        ) : 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                        {profile.location || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.skills?.join(', ') || ''}
                        onChange={(e) => setEditForm({ ...editForm, skills: e.target.value.split(', ').map(s => s.trim()) })}
                        placeholder="React, TypeScript, Node.js..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                        {profile.skills?.length > 0 ? profile.skills.join(', ') : 'No skills added'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditing}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && preferences && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => handleSavePreferences({ theme: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handleSavePreferences({ language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Content Type</label>
                    <select
                      value={preferences.defaultContentType}
                      onChange={(e) => handleSavePreferences({ defaultContentType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="all">All Resources</option>
                      <option value="code">Code</option>
                      <option value="videos">Videos</option>
                      <option value="datasets">Datasets</option>
                      <option value="papers">Papers</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  {[
                    { key: 'email', label: 'Email notifications', description: 'Receive updates about your account and activity' },
                    { key: 'push', label: 'Push notifications', description: 'Get instant updates in your browser' },
                    { key: 'recommendations', label: 'Personalized recommendations', description: 'Receive AI-powered resource suggestions' },
                    { key: 'updates', label: 'Product updates', description: 'Stay informed about new features and improvements' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{label}</h4>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notificationSettings[key as keyof typeof preferences.notificationSettings]}
                          onChange={(e) => handleSavePreferences({
                            notificationSettings: {
                              ...preferences.notificationSettings,
                              [key]: e.target.checked,
                            },
                          })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          preferences.notificationSettings[key as keyof typeof preferences.notificationSettings]
                            ? 'bg-purple-600 border-purple-600'
                            : 'bg-gray-200 border-gray-300'
                        }`}>
                          <Check className="h-3 w-3 text-white hidden" />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <SubscriptionManager onSubscriptionChange={(sub) => {
              // Update profile with subscription info
              if (profile && sub) {
                const updatedProfile = { ...profile, subscriptionId: sub.id };
                onProfileUpdate?.(updatedProfile);
              }
            }} />
          )}

          {/* Ranking Tab */}
          {activeTab === 'ranking' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Ranking & Progress</h3>
              {getUserRankingDisplay()}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}