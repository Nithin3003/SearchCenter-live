import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, MessageSquare, ChevronLeft, CalendarClock, Users, User, Info, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { supabase, createAdminClient } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  type: 'feedback_response' | 'announcement' | 'system';
  read: boolean;
  created_at: string;
  feedback_id?: string;
  admin_comment?: string;
  sender_email?: string;
}

export default function Notifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  
  // Check if user is admin
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'msnithin84@gmail.com' || 
                  user?.primaryEmailAddress?.emailAddress === '84msnithin@gmail.com';

  // Ensure user exists in database to receive notifications properly
  useEffect(() => {
    if (!user) return;
    
    const ensureUserInDatabase = async () => {
      try {
        const adminClient = createAdminClient();
        
        // Check if user exists in database
        const { data, error } = await adminClient
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();
          
        if (error || !data) {
          // User doesn't exist, create new entry
          const userData = {
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            first_name: user.firstName,
            last_name: user.lastName,
            avatar_url: user.imageUrl,
            last_signed_in: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          
          await adminClient
            .from('users')
            .insert(userData);
            
          console.log('Created missing user record');
        }
      } catch (err) {
        console.error('Error ensuring user in database:', err);
      }
    };
    
    ensureUserInDatabase();
  }, [user]);

  const fetchNotifications = async (refresh = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const currentPage = refresh ? 0 : page;
      const client = createAdminClient(); // Always use admin client to bypass RLS issues
      
      // For admins, fetch both personal notifications and system ones they should see
      let query = client
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
        
      if (isAdmin) {
        // Admins see notifications addressed to them and system notifications they should be aware of
        query = query.or(`user_id.eq.${user.id},type.eq.announcement,type.eq.system`);
      } else {
        // Regular users only see their own notifications
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Notification fetch error:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} notifications for user ${user.id} (admin: ${isAdmin})`);
      
      if (refresh) {
        setNotifications(data || []);
        setPage(0);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
        setPage(prev => prev + 1);
      }
      
      // If we got fewer results than pageSize, there are no more to fetch
      setHasMore((data?.length || 0) === pageSize);
      
      // Count unread
      const allNotifications = refresh ? data : [...notifications, ...(data || [])];
      setUnreadCount(allNotifications.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications(true);
    
    // Subscribe to new notifications - user specific
    const notificationsSubscription = supabase
      .channel(`user_notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        console.log('New notification received:', payload.new);
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
      
    // Subscribe to notification updates
    const notificationUpdatesSubscription = supabase
      .channel(`notification_updates_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        setNotifications(prev => 
          prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
        );
      })
      .subscribe();
      
    // Subscribe to system notifications for all users
    const systemSubscription = supabase
      .channel(`system_notifications`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `type=in.(announcement,system)`
      }, payload => {
        // Only add if it's not already in our list (by id)
        const newNotif = payload.new as Notification;
        
        // If it's a system notification meant for everyone or specifically this user
        if (newNotif.user_id === null || newNotif.user_id === user.id) {
          console.log('System notification received:', newNotif);
          setNotifications(prev => {
            if (!prev.some(n => n.id === newNotif.id)) {
              return [newNotif, ...prev];
            }
            return prev;
          });
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();
    
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          expandedRef.current && !expandedRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedView(false);
        setSelectedNotification(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Escape key closes views
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNotification) {
          setSelectedNotification(null);
        } else if (expandedView) {
          setExpandedView(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      notificationsSubscription.unsubscribe();
      notificationUpdatesSubscription.unsubscribe();
      systemSubscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [user, isAdmin]);

  const markAsRead = async (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const client = createAdminClient();
      
      const { error } = await client
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
        
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      // Also update selected notification if it's the same one
      if (selectedNotification?.id === id) {
        setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
      }
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      if (!user || notifications.length === 0) return;
      
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      const client = createAdminClient();
      
      const { error } = await client
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
        
      if (error) throw error;
        
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Also update selected notification
      if (selectedNotification && !selectedNotification.read) {
        setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
      }
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };
  
  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Toggle expanded view
  const toggleExpandedView = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setExpandedView(!expandedView);
    setSelectedNotification(null);
  };
  
  // View notification details
  const viewNotificationDetails = (notification: Notification, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedNotification(notification);
    
    // Mark as read when viewing details
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };
  
  // Back to list from notification details
  const backToList = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedNotification(null);
  };

  // Notification card component for list view
  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <div 
      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''}`}
      onClick={(e) => viewNotificationDetails(notification, e)}
    >
      <div className="flex">
        <div className={`flex-shrink-0 mr-3 mt-1 ${
          notification.type === 'announcement' ? 'text-blue-500' : 
          notification.type === 'feedback_response' ? 'text-green-500' : 'text-gray-500'
        }`}>
          {notification.type === 'announcement' ? (
            <Users className="h-5 w-5" />
          ) : notification.type === 'feedback_response' ? (
            <MessageSquare className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
              {!notification.read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>}
            </h4>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex-shrink-0">
              {formatTime(notification.created_at)}
            </span>
          </div>
          
          <p className="text-xs mt-1 text-gray-600 line-clamp-2">
            {notification.content}
          </p>
          
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-indigo-600" onClick={toggleExpandedView} >View details</span>
            
            <button
              onClick={(e) => markAsRead(notification.id, e)}
              className={`text-xs px-1.5 py-0.5 rounded ${
                notification.read 
                  ? 'text-gray-400' 
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              {notification.read ? 'Read' : 'Mark read'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Notification detail view
  const NotificationDetailView = ({ notification }: { notification: Notification }) => (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center">
          <button 
            onClick={backToList}
            className="mr-2 p-1 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="font-medium text-gray-900">{notification.title}</h3>
        </div>
        <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex items-center mb-4">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
            notification.type === 'announcement' ? 'bg-blue-100 text-blue-600' : 
            notification.type === 'feedback_response' ? 'bg-green-100 text-green-600' : 
            'bg-gray-100 text-gray-600'
          }`}>
            {notification.type === 'announcement' ? (
              <Users className="h-4 w-4" />
            ) : notification.type === 'feedback_response' ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {notification.type === 'announcement' ? 'Announcement' : 
               notification.type === 'feedback_response' ? 'Feedback Response' : 
               'System Notification'}
            </p>
            {notification.sender_email && (
              <p className="text-xs text-gray-500">From: {notification.sender_email}</p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm whitespace-pre-wrap">{notification.content}</p>
        </div>
        
        {notification.type === 'feedback_response' && notification.admin_comment && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1 text-indigo-500" />
              Admin Response
            </h4>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{notification.admin_comment}</p>
            </div>
          </div>
        )}
        
        {notification.feedback_id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link 
              to={`/feedback?id=${notification.feedback_id}`} 
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <Info className="h-4 w-4 mr-1" />
              View original feedback
            </Link>
          </div>
        )}
      </div>
      
      <div className="pt-3 border-t border-gray-200 mt-auto">
        <div className="flex justify-end">
          <button
            onClick={backToList}
            className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to notifications
          </button>
        </div>
      </div>
    </div>
  );

  // Bell icon with dropdown
  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          className="relative p-2 text-gray-700 hover:text-indigo-600 rounded-full hover:bg-gray-100"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) fetchNotifications(true);
          }}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        {isOpen && (
          <div 
          className={`shadow-lg overflow-hidden z-[100] border border-gray-200 transition-all duration-200 bg-white rounded-md ${
            expandedView 
                ? 'fixed top-[72px] left-1/2 -translate-x-1/2 w-[90%] max-w-[800px]' 
                : 'absolute mt-2 w-80 right-0'
            }`}
            style={{
              maxHeight: expandedView ? 'calc(100vh - 160px)' : 'auto'
            }}
          >
            <div className="p-3 bg-indigo-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-700">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button 
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    onClick={(e) => markAllAsRead(e)}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={toggleExpandedView}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  {expandedView ? (
                    <>
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Expand
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div 
              className={`flex ${expandedView ? 'h-[500px] max-h-[calc(100vh-200px)]' : 'block'}`} 
              ref={expandedRef}
            >
              {/* Notifications list - always visible */}
              <div className={`${expandedView ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
                <div className={`overflow-y-auto ${expandedView ? 'h-[calc(100%-36px)]' : 'max-h-96'}`}>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div>
                      {/* Only limit in compact view, show all in expanded */}
                      {(expandedView ? notifications : notifications.slice(0, 5)).map(notification => (
                        <NotificationCard 
                          key={notification.id} 
                          notification={notification} 
                        />
                      ))}
                      
                      {expandedView && hasMore && (
                        <div className="p-3 text-center">
                          <button
                            onClick={() => fetchNotifications()}
                            disabled={loading}
                            className={`px-3 py-1 rounded text-sm ${
                              loading
                                ? 'bg-gray-100 text-gray-400'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                          >
                            {loading ? 'Loading...' : 'Load more'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Footer is only shown in compact view */}
                {!expandedView && (
                  <div className="p-2 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-500">
                    <button 
                      onClick={toggleExpandedView}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
              
              {/* Detail view pane - only visible in expanded view */}
              {expandedView && (
                <div className="w-1/2">
                  {selectedNotification ? (
                    <NotificationDetailView notification={selectedNotification} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                      <p className="text-sm">Select a notification to view details</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}