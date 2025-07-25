import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, Eye, X, MessageSquare, Search, Star, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase, createAdminClient } from '../lib/supabase';
import { FeedbackItem } from '../types';
import ComposeNotification from '../components/ComposeNotification';

const NotificationsTab = () => {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<'all' | 'active' | 'specific'>('all');
  const [specificEmails, setSpecificEmails] = useState('');
  const [notificationType, setNotificationType] = useState<'announcement' | 'system'>('announcement');

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Please enter both title and message');
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      
      const adminClient = createAdminClient();
      
      let usersToNotify: any[] = [];
      
      if (selectedUsers === 'specific') {
        const emails = specificEmails.split(',').map(email => email.trim()).filter(Boolean);
        if (emails.length === 0) {
          setError('Please enter at least one valid email address');
          setSending(false);
          return;
        }
        
        const { data, error } = await adminClient
          .from('users')
          .select('id, clerk_id')
          .in('email', emails);
          
        if (error) throw error;
        usersToNotify = data || [];
      } else if (selectedUsers === 'active') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data, error } = await adminClient
          .from('users')
          .select('id, clerk_id')
          .gt('last_signed_in', thirtyDaysAgo.toISOString());
          
        if (error) throw error;
        usersToNotify = data || [];
      } else {
        const { data, error } = await adminClient
          .from('users')
          .select('id, clerk_id');
          
        if (error) throw error;
        usersToNotify = data || [];
      }
      
      if (usersToNotify.length === 0) {
        setError('No users found matching the selected criteria');
        setSending(false);
        return;
      }
      
      const notifications = usersToNotify.map(user => ({
        user_id: user.clerk_id,
        title: title.trim(),
        content: message.trim(),
        type: notificationType,
        read: false,
        created_at: new Date().toISOString()
      }));
      
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { error } = await adminClient
          .from('notifications')
          .insert(batch);
          
        if (error) throw error;
      }
      
      setSuccess(true);
      setTitle('');
      setMessage('');
      setSpecificEmails('');
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error sending notifications:', err);
      setError(err.message || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Send Notifications</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={notificationType === 'announcement'}
                onChange={() => setNotificationType('announcement')}
              />
              <span>Announcement</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={notificationType === 'system'}
                onChange={() => setNotificationType('system')}
              />
              <span>System Message</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients
          </label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={selectedUsers === 'all'}
                onChange={() => setSelectedUsers('all')}
              />
              <span>All Users</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={selectedUsers === 'active'}
                onChange={() => setSelectedUsers('active')}
              />
              <span>Active Users (last 30 days)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={selectedUsers === 'specific'}
                onChange={() => setSelectedUsers('specific')}
              />
              <span>Specific Users</span>
            </label>
            
            {selectedUsers === 'specific' && (
              <div className="ml-6 mt-2">
                <textarea
                  value={specificEmails}
                  onChange={(e) => setSpecificEmails(e.target.value)}
                  placeholder="Enter email addresses, separated by commas"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter email addresses separated by commas
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={5}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm">
            Notifications sent successfully!
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={sendNotification}
            disabled={sending}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              sending ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [viewingFeedback, setViewingFeedback] = useState<FeedbackItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'feedback' | 'notifications' | 'users'>('feedback');
  const [selectedFeedback, setSelectedFeedback] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [adminCommentDraft, setAdminCommentDraft] = useState<string>('');
  
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'msnithin84@gmail.com' || 
                  user?.primaryEmailAddress?.emailAddress === '84msnithin@gmail.com';
  
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const adminClient = createAdminClient();
        
        const { data: feedbackData, error: feedbackError } = await adminClient
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (feedbackError) {
          console.error('Feedback fetch error:', feedbackError);
          throw feedbackError;
        }
        
        console.log('Feedback data fetched:', feedbackData?.length || 0, 'items');
        setFeedbackItems(feedbackData || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    const feedbackSubscription = supabase
      .channel('feedback_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'feedback' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setFeedbackItems(prev => [payload.new as FeedbackItem, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setFeedbackItems(prev => 
            prev.map(item => item.id === payload.new.id ? payload.new as FeedbackItem : item)
          );
          if (viewingFeedback?.id === payload.new.id) {
            setViewingFeedback(payload.new as FeedbackItem);
          }
        } else if (payload.eventType === 'DELETE') {
          setFeedbackItems(prev => prev.filter(item => item.id !== payload.old.id));
          if (viewingFeedback?.id === payload.old.id) {
            setViewingFeedback(null);
          }
        }
      })
      .subscribe();
      
    return () => {
      feedbackSubscription.unsubscribe();
    };
  }, [isAdmin, viewingFeedback]);
  
  useEffect(() => {
    if (viewingFeedback) {
      setAdminCommentDraft(viewingFeedback.admin_comment || '');
    }
  }, [viewingFeedback?.id]);
  
  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const adminClient = createAdminClient();
      
      const { error } = await adminClient
        .from('feedback')
        .update({ resolved: status === 'resolved' })
        .eq('id', id);
        
      if (error) throw error;
      
      setFeedbackItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, resolved: status === 'resolved' } : item
        )
      );
      
      if (viewingFeedback?.id === id) {
        setViewingFeedback(prev => 
          prev ? { ...prev, resolved: status === 'resolved' } : null
        );
      }
    } catch (err) {
      console.error('Error updating feedback status:', err);
      setError('Failed to update feedback status');
    }
  };
  
  const addAdminComment = async (id: string, comment: string) => {
    try {
      if (!comment.trim()) return;
      
      const adminClient = createAdminClient();
      
      // First update the feedback with the comment
      const { data: updatedFeedback, error } = await adminClient
        .from('feedback')
        .update({ 
          admin_comment: comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, user_id, content, email')
        .single();
        
      if (error) throw error;
      
      // Now create a notification for the user
      if (updatedFeedback && updatedFeedback.user_id) {
        // Create a notification for the user who submitted the feedback
        await adminClient
          .from('notifications')
          .insert({
            user_id: updatedFeedback.user_id,
            title: 'Admin responded to your feedback',
            content: `Your feedback has been reviewed by an admin`,
            type: 'feedback_response',
            read: false,
            created_at: new Date().toISOString(),
            feedback_id: id,
            admin_comment: comment
          });
      }
      
      // Update the local state
      setFeedbackItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, admin_comment: comment } : item
        )
      );
      
      if (viewingFeedback?.id === id) {
        setViewingFeedback(prev => 
          prev ? { ...prev, admin_comment: comment } : null
        );
        // Also update the draft to match the saved value
        setAdminCommentDraft(comment);
      }
    } catch (err) {
      console.error('Error adding admin comment:', err);
      setError('Failed to add comment');
    }
  };
  
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedFeedback(new Set());
  };

  const toggleFeedbackSelection = (id: string, event: React.MouseEvent) => {
    if (!isSelectMode) return;
    
    // Stop propagation to prevent opening the feedback detail view
    event.stopPropagation();
    
    const newSelected = new Set(selectedFeedback);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFeedback(newSelected);
  };

  const selectAllVisible = () => {
    const newSelected = new Set<string>();
    filteredFeedback.forEach(item => newSelected.add(item.id));
    setSelectedFeedback(newSelected);
  };

  const clearSelection = () => {
    setSelectedFeedback(new Set());
  };

  const bulkUpdateFeedbackStatus = async (status: string) => {
    if (selectedFeedback.size === 0) return;
    
    try {
      setLoading(true);
      const adminClient = createAdminClient();
      
      // Convert Set to Array for the IN clause
      const ids = Array.from(selectedFeedback);
      
      const { error } = await adminClient
        .from('feedback')
        .update({ resolved: status === 'resolved' })
        .in('id', ids);
        
      if (error) throw error;
      
      // Update local state
      setFeedbackItems(prev => 
        prev.map(item => 
          selectedFeedback.has(item.id) 
            ? { ...item, resolved: status === 'resolved' } 
            : item
        )
      );
      
      // Clear selection after successful update
      clearSelection();
      setError(null);
    } catch (err) {
      console.error('Error updating feedback status in bulk:', err);
      setError('Failed to update feedback status');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedbackItems.filter(item => {
    const matchesSearch = 
      (item.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.feedback_type?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'resolved' && item.resolved) || 
      (statusFilter === 'unresolved' && !item.resolved);
    
    const matchesType = 
      typeFilter === 'all' || 
      item.feedback_type?.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const feedbackTypes = ['all', ...new Set(feedbackItems.map(item => item.feedback_type || 'general'))];
  
  const renderRating = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };
  
  const renderFeedbackList = () => {
    if (filteredFeedback.length === 0) {
      return (
        <div className="text-center py-12 flex flex-col items-center text-gray-500">
          <AlertCircle className="h-10 w-10 mb-2 text-gray-400" />
          <p>No feedback items found.</p>
          {searchQuery && <p className="mt-1 text-sm">Try adjusting your search filters.</p>}
        </div>
      );
    }
    
    return (
      <>
        {/* Batch actions bar */}
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleSelectMode}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                isSelectMode 
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelectMode ? 'Cancel Selection' : 'Select Feedback'}
            </button>
            
            {isSelectMode && (
              <>
                <span className="text-sm text-gray-500">
                  {selectedFeedback.size} selected
                </span>
                <button 
                  onClick={selectAllVisible}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={filteredFeedback.length === 0}
                >
                  Select All
                </button>
                <button 
                  onClick={clearSelection}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={selectedFeedback.size === 0}
                >
                  Clear
                </button>
              </>
            )}
          </div>
          
          {isSelectMode && selectedFeedback.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => bulkUpdateFeedbackStatus('resolved')}
                className="px-3 py-1.5 rounded text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark as Resolved
              </button>
              <button
                onClick={() => bulkUpdateFeedbackStatus('unresolved')}
                className="px-3 py-1.5 rounded text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Mark as Pending
              </button>
            </div>
          )}
        </div>
        
        {/* Feedback grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeedback.map((feedback) => (
            <div 
              key={feedback.id} 
              className={`relative bg-white border ${
                selectedFeedback.has(feedback.id) 
                  ? 'border-indigo-500 ring-2 ring-indigo-200' 
                  : 'border-gray-200'
              } p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
              onClick={(e) => isSelectMode ? toggleFeedbackSelection(feedback.id, e) : setViewingFeedback(feedback)}
            >
              {/* Selection checkbox - only shown in select mode */}
              {isSelectMode && (
                <div className="absolute top-2 right-2">
                  <input 
                    type="checkbox"
                    checked={selectedFeedback.has(feedback.id)}
                    onChange={() => {}} // Handled by the div click
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-indigo-500 mr-1" />
                    <h3 className="text-lg font-medium text-gray-900 capitalize">
                      {feedback.feedback_type || 'General Feedback'}
                    </h3>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span className="block truncate">{feedback.email}</span>
                    <span className="block text-xs">{formatDate(feedback.created_at || '')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    feedback.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {feedback.resolved ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Resolved</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Pending</>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="mt-2">
                {renderRating(feedback.rating)}
              </div>
              
              <div className="mt-3 text-sm text-gray-700 line-clamp-2">
                {feedback.content}
              </div>
              
              {feedback.admin_comment && (
                <div className="mt-2 p-2 bg-indigo-50 text-xs text-indigo-700 rounded-md">
                  <p className="font-medium">Admin note:</p>
                  <p className="line-clamp-1">{feedback.admin_comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {!isAdmin ? (
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-gray-700">Unauthorized Access</h1>
            <p className="mt-2 text-gray-500">You don't have permission to access this page.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
            <p className="mt-2 text-gray-500">Loading admin panel...</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
            
            {error && (
              <div className="mb-6 bg-red-50 p-4 rounded-md text-red-600">
                {error}
              </div>
            )}
            
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'feedback'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Feedback
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notifications'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Users
                </button>
              </nav>
            </div>
            
            {activeTab === 'feedback' && (
              <div>
                <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Search input */}
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search feedback..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="inline-flex">
                    <label className="inline-flex items-center mr-2 text-sm text-gray-700">
                      Status:
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-40 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="resolved">Resolved</option>
                      <option value="unresolved">Pending</option>
                    </select>
                  </div>

                  {/* Type filter */}
                  <div className="inline-flex">
                    <label className="inline-flex items-center mr-2 text-sm text-gray-700">
                      Type:
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="block w-40 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {feedbackTypes.map(type => (
                        <option key={type} value={type}>
                          {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stats summary */}
                  <div className="flex space-x-3 ml-auto">
                    <div className="px-3 py-1 rounded-md bg-yellow-50 text-yellow-700 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Pending: {feedbackItems.filter(item => !item.resolved).length}</span>
                    </div>
                    <div className="px-3 py-1 rounded-md bg-green-50 text-green-700 text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Resolved: {feedbackItems.filter(item => item.resolved).length}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback view */}
                {viewingFeedback ? (
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-indigo-600 mr-2" />
                        <h3 className="text-xl font-medium text-gray-900 capitalize">
                          {viewingFeedback.feedback_type || 'General Feedback'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setViewingFeedback(null)}
                        className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm font-medium text-gray-500 mb-1">From</p>
                          <div className="flex items-center">
                            <div className="bg-indigo-100 text-indigo-800 h-8 w-8 rounded-full flex items-center justify-center mr-2">
                              {viewingFeedback.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{viewingFeedback.email}</p>
                              <p className="text-xs text-gray-500">
                                Submitted {formatDate(viewingFeedback.created_at || '')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm font-medium text-gray-500 mb-1">Rating</p>
                          <div className="flex items-center">
                            {renderRating(viewingFeedback.rating)}
                            {viewingFeedback.rating && (
                              <span className="ml-2 text-sm text-gray-600">
                                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][Math.min(Math.floor(viewingFeedback.rating) - 1, 4)]}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateFeedbackStatus(viewingFeedback.id, 'resolved')}
                              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                                viewingFeedback.resolved ? 'bg-green-100 text-green-800 ring-1 ring-green-600' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                              }`}
                            >
                              <CheckCircle className={`h-4 w-4 mr-1 ${viewingFeedback.resolved ? 'text-green-600' : ''}`} />
                              Resolved
                            </button>
                            
                            <button
                              onClick={() => updateFeedbackStatus(viewingFeedback.id, 'unresolved')}
                              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                                !viewingFeedback.resolved ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
                              }`}
                            >
                              <AlertCircle className={`h-4 w-4 mr-1 ${!viewingFeedback.resolved ? 'text-yellow-600' : ''}`} />
                              Pending
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm font-medium text-gray-500 mb-1">Feedback Message</p>
                          <div className="mt-1 text-gray-900 bg-white p-3 rounded border border-gray-200 min-h-[100px] max-h-[200px] overflow-y-auto">
                            <p className="whitespace-pre-wrap">{viewingFeedback.content}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Admin Comment</p>
                          <textarea
                            value={adminCommentDraft}
                            onChange={(e) => setAdminCommentDraft(e.target.value)}
                            placeholder="Add your notes here..."
                            className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 h-[120px]"
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              {adminCommentDraft !== (viewingFeedback?.admin_comment || '') ? 
                                'Unsaved changes' : ''}
                            </span>
                            <button
                              onClick={() => {
                                if (viewingFeedback && adminCommentDraft.trim()) {
                                  addAdminComment(viewingFeedback.id, adminCommentDraft);
                                }
                              }}
                              disabled={!adminCommentDraft.trim() || adminCommentDraft === viewingFeedback?.admin_comment}
                              className={`px-4 py-2 rounded-md text-sm font-medium ${
                                !adminCommentDraft.trim() || adminCommentDraft === viewingFeedback?.admin_comment
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                              }`}
                            >
                              Save Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderFeedbackList()
                )}
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <ComposeNotification />
            )}
            
            {activeTab === 'users' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                <p className="text-gray-500">User management features coming soon.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}