import { supabase, createAdminClient } from '../lib/supabase';
import { SearchHistoryItem,  FeedbackItem } from '../types';
import { getProperUserId } from '../lib/userUtils';

export const searchService = {
  async saveSearchHistory(userId: string, query: string): Promise<void> {
    try {
      // Check if userId is a Clerk ID (starts with user_) and convert to database UUID if needed
      let databaseUserId = userId;
      
      if (userId.startsWith('user_')) {
        // This is a Clerk ID, we need to get the corresponding database UUID
        const adminClient = createAdminClient();
        
        // First check if this user exists in our database
        const { data: existingUser, error: lookupError } = await adminClient
          .from('users')
          .select('id')
          .eq('clerk_id', userId)
          .single();
        
        if (lookupError || !existingUser) {
          // User doesn't exist yet - new user
          console.log('New user detected. Creating user record first.');
          
          // Create basic user record - you might want to fetch more details from Clerk API
          const { data: newUser, error: insertError } = await adminClient
            .from('users')
            .insert({
              clerk_id: userId,
              email: 'pending@example.com', // Placeholder
              created_at: new Date().toISOString(),
              last_signed_in: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (insertError || !newUser) {
            console.error('Error creating new user record:', insertError);
            return; // Exit early
          }
          
          databaseUserId = newUser.id;
        } else {
          databaseUserId = existingUser.id;
        }
      }
      
      // Now use the proper UUID to save search history
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: databaseUserId, // Using the database UUID now
          query,
          timestamp: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error inserting search history:', error);
        return;
      }
      
      // Increment search count with proper UUID
      try {
        await supabase.rpc('increment_search_count', {
          user_id: databaseUserId
        });
      } catch (err) {
        console.error('Error incrementing search count:', err);
      }
      
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  },
  
  async getSearchHistory(userId: string): Promise<SearchHistoryItem[]> {
    try {
      // Check if this is a Clerk ID (starts with user_)
      if (userId.startsWith('user_')) {
        // Get the admin client to bypass RLS for user lookup
        const adminClient = createAdminClient();
        
        // First, try to find the corresponding database UUID for this Clerk ID
        const { data: existingUser, error: lookupError } = await adminClient
          .from('users')
          .select('id')
          .eq('clerk_id', userId)
          .single();
        
        if (lookupError || !existingUser) {
          console.log('User not found in database. Returning empty search history.');
          return []; // Return empty array for users not in database yet
        }
        
        // Use the database UUID instead of Clerk ID
        userId = existingUser.id;
      }
      
      // Verify the userId is now in UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('Invalid UUID format:', userId);
        return []; // Return empty array for invalid UUIDs
      }
      
      // Now use the properly formatted UUID for the query
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching search history:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  },
  
  async saveFeedback(feedback: any): Promise<void> {
    try {
      // Log environment variables for debugging (remove in production)
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Service role key exists:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
      
      // Get the admin client to bypass RLS
      const adminClient = createAdminClient();
      
      // Make a clean copy of the feedback data
      const feedbackData = {
        user_id: feedback.user_id,
        feedback_type: feedback.feedback_type,
        content: feedback.content,
        rating: feedback.rating,
        email: feedback.email,
        resolved: feedback.resolved || false
      };
      
      console.log('Submitting feedback data:', feedbackData);
      
      // Use the admin client to bypass RLS
      const { error } = await adminClient
        .from('feedback')
        .insert(feedbackData);
        
      if (error) {
        console.error('Error saving feedback:', error);
        throw error;
      }
    } catch (error) {
      // Improve error handling for API key issues
      if (error.message === 'Invalid API key') {
        console.error('Error: Invalid Supabase API key. Please check your environment variables.');
        throw new Error('Authentication error. Please contact support.');
      } else {
        console.error('Error saving feedback:', error);
        throw error;
      }
    }
  },
  
  async saveAnonymousFeedback(feedback: any): Promise<void> {
    try {
      // For anonymous feedback, we use the regular client
      // but ensure user_id is null to work with any RLS policies
      const feedbackData = {
        ...feedback,
        user_id: null // Ensure it's null
      };
      
      const { error } = await supabase
        .from('feedback')
        .insert(feedbackData);
        
      if (error) {
        console.error('Error saving anonymous feedback:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveAnonymousFeedback:', error);
      throw error;
    }
  },
  
  async getFeedback(): Promise<FeedbackItem[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },
  
  async updateFeedbackStatus(id: number, status: string, isAdmin: boolean): Promise<void> {
    if (!isAdmin) {
      throw new Error('Permission denied: Only admins can update feedback status');
    }
    
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  },
  
  async deleteFeedback(id: number, isAdmin: boolean): Promise<void> {
    if (!isAdmin) {
      throw new Error('Permission denied: Only admins can delete feedback');
    }
    
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

  // Get chat messages
  async getChatMessages(limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('community_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  },

  // Send a chat message
  async sendChatMessage(userId: string, username: string, message: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('community_chat')
        .insert({
          user_id: userId,
          username,
          message,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }
};