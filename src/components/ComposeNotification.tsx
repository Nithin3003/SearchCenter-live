import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Users, User } from 'lucide-react';
import { createAdminClient } from '../lib/supabase';

interface ComposeNotificationProps {
  onSuccess?: () => void;
}

export default function ComposeNotification({ onSuccess }: ComposeNotificationProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
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
      
      // Get users based on selected option
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
        
        if (usersToNotify.length === 0) {
          setError('No users found with the specified email addresses');
          setSending(false);
          return;
        }
      } else if (selectedUsers === 'active') {
        // Get users who were active in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data, error } = await adminClient
          .from('users')
          .select('id, clerk_id')
          .gt('last_signed_in', thirtyDaysAgo.toISOString());
          
        if (error) throw error;
        usersToNotify = data || [];
      } else {
        // Get all users
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
      
      console.log(`Sending notification to ${usersToNotify.length} users`);
      
      // Prepare notifications
      const notifications = usersToNotify.map(user => ({
        user_id: user.clerk_id,
        title: title.trim(),
        content: message.trim(),
        type: notificationType,
        read: false,
        created_at: new Date().toISOString()
      }));
      
      // Send notifications in batches if there are many
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
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success message after a delay
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
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Send className="h-5 w-5 mr-2 text-indigo-600" />
        Send Notifications
      </h2>
      
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
        
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                All Users
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={selectedUsers === 'active'}
                onChange={() => setSelectedUsers('active')}
              />
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-green-500" />
                Active Users (last 30 days)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2 h-4 w-4 text-indigo-600"
                checked={selectedUsers === 'specific'}
                onChange={() => setSelectedUsers('specific')}
              />
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1 text-blue-500" />
                Specific Users
              </span>
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
                  Enter email addresses separated by commas (e.g. user@example.com, another@example.com)
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            rows={5}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>Notifications sent successfully!</p>
          </div>
        )}
        
        <div className="flex justify-end pt-2">
          <button
            onClick={sendNotification}
            disabled={sending}
            className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
              sending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}