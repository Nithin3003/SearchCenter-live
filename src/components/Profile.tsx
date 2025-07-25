import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Loader2, User, Mail, Calendar, Clock, Edit, CheckCircle, X, Camera, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAdminClient } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface DatabaseUser {
  id: string;
  clerk_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
  last_signed_in: string;
  settings?: any;
}

function UserProfile() {
  const { user } = useUser();
  const [databaseUser, setDatabaseUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for editable fields
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    firstName: '',
    lastName: '',
  });
  const [activeTab, setActiveTab] = useState('profile');

  // Get database user data
  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const adminClient = createAdminClient();
        
        const { data, error } = await adminClient
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user data:', error);
          // If user doesn't exist in database, trigger the sync
          if (error.code === 'PGRST116') { // No rows found
            console.log('User not found in database, triggering sync');
            await createOrUpdateUser();
          }
        } else {
          setDatabaseUser(data);
          // Initialize edit values with current values
          setEditValues({
            firstName: data.first_name || user.firstName || '',
            lastName: data.last_name || user.lastName || '',
          });
        }
      } catch (err) {
        console.error('Error in user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const createOrUpdateUser = async () => {
      try {
        const adminClient = createAdminClient();
        
        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          avatar_url: user.imageUrl,
          last_signed_in: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await adminClient
          .from('users')
          .upsert(userData)
          .select();
          
        if (error) {
          console.error('Error creating/updating user:', error);
        } else {
          setDatabaseUser(data[0]);
          setEditValues({
            firstName: data[0].first_name || '',
            lastName: data[0].last_name || '',
          });
          console.log('User created or updated in database');
        }
      } catch (err) {
        console.error('Error creating user:', err);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Handler for updating user information
  const updateUserField = async (field: string) => {
    if (!user || !databaseUser) return;
    
    try {
      setSaving(true);
      const adminClient = createAdminClient();
      
      let updateData: Record<string, any> = {};
      
      if (field === 'name') {
        // Update in database
        updateData = {
          first_name: editValues.firstName,
          last_name: editValues.lastName,
        };
        
        // Also update in Clerk if needed
        try {
          await user.update({
            firstName: editValues.firstName,
            lastName: editValues.lastName,
          });
        } catch (clerkError) {
          console.error('Error updating Clerk user:', clerkError);
        }
      }
      
      const { error } = await adminClient
        .from('users')
        .update(updateData)
        .eq('clerk_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setDatabaseUser(prev => prev ? {
        ...prev,
        ...updateData
      } : null);
      
      toast.success(`Profile updated successfully!`);
      setEditMode(null);
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditMode(null);
    setEditValues({
      firstName: databaseUser?.first_name || user?.firstName || '',
      lastName: databaseUser?.last_name || user?.lastName || '',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading user profile...</span>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
    
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-gray-800">Not Authenticated</h1>
            <p className="text-gray-600">Please sign in to view your profile</p>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main content - starts exactly below navbar */}
      <main className="flex-grow pt-6 pb-12 px-40 mt-20   sm:p-2">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-lg rounded-lg overflow-hidden"
          >
            {/* Profile Header with Avatar */}
            <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-6 sm:p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-center">
                <div className="relative group">
                  <motion.img 
                    src={user.imageUrl} 
                    alt={user.fullName || 'User'} 
                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                    whileHover={{ scale: 1.05 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-white">
                    {editMode === 'name' ? (
                      <div className="flex flex-col space-y-2">
                        <input
                          type="text"
                          value={editValues.firstName}
                          onChange={e => setEditValues({...editValues, firstName: e.target.value})}
                          className="px-2 py-1 rounded text-gray-800 text-lg font-medium"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          value={editValues.lastName}
                          onChange={e => setEditValues({...editValues, lastName: e.target.value})}
                          className="px-2 py-1 rounded text-gray-800 text-lg font-medium"
                          placeholder="Last name"
                        />
                        <div className="flex space-x-2 mt-2">
                          <button 
                            onClick={() => updateUserField('name')}
                            disabled={saving}
                            className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>
                          {databaseUser?.first_name || user.firstName || ''} {databaseUser?.last_name || user.lastName || ''}
                        </span>
                        <button 
                          onClick={() => setEditMode('name')}
                          className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    )}
                  </h1>
                  <p className="text-indigo-100">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 font-medium text-center transition-colors ${
                  activeTab === 'profile' 
                    ? 'text-indigo-600 border-b-2 border-indigo-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile Information
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-4 font-medium text-center transition-colors ${
                  activeTab === 'settings' 
                    ? 'text-indigo-600 border-b-2 border-indigo-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Settings
              </motion.button>
            </div>
            
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-6 sm:p-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
                    
                    <div className="space-y-4">
                      <motion.div 
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                        whileHover={{ scale: 1.01 }}
                      >
                        <User className="h-5 w-5 text-indigo-500 mr-2" />
                        <span className="text-gray-600 w-32">First Name:</span>
                        <span className="font-medium">{databaseUser?.first_name || user.firstName || 'Not provided'}</span>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                        whileHover={{ scale: 1.01 }}
                      >
                        <User className="h-5 w-5 text-indigo-500 mr-2" />
                        <span className="text-gray-600 w-32">Last Name:</span>
                        <span className="font-medium">{databaseUser?.last_name || user.lastName || 'Not provided'}</span>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                        whileHover={{ scale: 1.01 }}
                      >
                        <Mail className="h-5 w-5 text-indigo-500 mr-2" />
                        <span className="text-gray-600 w-32">Email:</span>
                        <span className="font-medium">{user.primaryEmailAddress?.emailAddress || 'Not provided'}</span>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                        whileHover={{ scale: 1.01 }}
                      >
                        <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                        <span className="text-gray-600 w-32">Joined On:</span>
                        <span className="font-medium">
                          {databaseUser?.created_at 
                            ? new Date(databaseUser.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Not available'}
                        </span>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                        whileHover={{ scale: 1.01 }}
                      >
                        <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                        <span className="text-gray-600 w-32">Last Sign In:</span>
                        <span className="font-medium">
                          {databaseUser?.last_signed_in 
                            ? new Date(databaseUser.last_signed_in).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Never'}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50"
                  >
                    <div className="max-w-3xl mx-auto">
                      <h3 className="text-md font-medium text-gray-700 mb-3">Your Activity Overview</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        This section will soon display your recent activity and engagement with SearchCenter.
                      </p>
                      
                      <div className="flex justify-center">
                        <div className="w-full h-12 rounded-md bg-gray-200 animate-pulse">
                          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                            Activity data coming soon
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              
              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 sm:p-8"
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <h3 className="text-md font-medium text-gray-800 mb-2">Profile Information</h3>
                      <p className="text-sm text-gray-500 mb-4">Update your name and personal details</p>
                      
                      <button 
                        onClick={() => setEditMode('name')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                      >
                        Edit Profile
                      </button>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <h3 className="text-md font-medium text-gray-800 mb-2">Email Preferences</h3>
                      <p className="text-sm text-gray-500 mb-3">Manage your email notification settings</p>
                      
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-indigo-600 mr-2" /> 
                          <span className="text-sm text-gray-700">Receive product updates</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-indigo-600 mr-2" /> 
                          <span className="text-sm text-gray-700">Receive important notifications</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <h3 className="text-md font-medium text-gray-800 mb-2">Account ID</h3>
                      <p className="text-sm text-gray-500 mb-3">Your unique identifier in our system</p>
                      
                      <div className="bg-gray-100 p-2 rounded-md">
                        <code className="text-xs text-gray-700">{databaseUser?.id || 'Not available'}</code>
                      </div>
                      
                      <div className="mt-2 bg-gray-100 p-2 rounded-md">
                        <code className="text-xs text-gray-700">{user?.id || 'Not available'}</code>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-white p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="h-24 flex items-center justify-center text-gray-500">
              <p>Your recent activity will appear here soon.</p>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default UserProfile;