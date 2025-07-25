import { createClient } from '@supabase/supabase-js';
import { 
  SearchHistoryItem,  
  FeedbackItem,
  UserProfile,
  UserPreferences
} from '../types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ongfdcvzckfbrmrxroxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZ2ZkY3Z6Y2tmYnJtcnhyb3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzMzg3MTUsImV4cCI6MjAzMDkxNDcxNX0.MBPSa3JNWfkbvOmtbpwKqJCnfB2J5nH6H7YVH3cAC7U';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a supabase admin client with the service role key (for bypassing RLS)
// Important: This should ONLY be used in server-side code or protected admin routes
export const createAdminClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    throw new Error('Supabase configuration is missing');
  }
  
  // Log the first few characters of the key for debugging (remove in production)
  const keyPreview = supabaseServiceKey.substring(0, 5) + '...' + 
                    supabaseServiceKey.substring(supabaseServiceKey.length - 3);
  console.log('Using service key (preview):', keyPreview);
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Synchronize Clerk auth with Supabase
export const syncUserWithSupabase = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error syncing Clerk session with Supabase:', error);
    throw error;
  }
};

// Enhanced user profile function that accepts more Clerk user data
export const saveUserProfile = async (
  userId: string, 
  email: string, 
  firstName: string | null = null,
  lastName: string | null = null,
  fullName: string | null = null,
  profileImageUrl: string | null = null,
  username: string = email.split('@')[0]
) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      profile_image_url: profileImageUrl,
      username,
      last_sign_in_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    
  if (error) throw error;
  
  // Initialize user preferences if this is a new user
  await initUserPreferences(userId);
  
  return data;
};

// Initialize user preferences (called after user profile is created/updated)
export const initUserPreferences = async (userId: string) => {
  // First check if preferences already exist
  const { data: existingPrefs } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  // If preferences don't exist, create them
  if (!existingPrefs) {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        id: userId, // Same as user_id for ease of reference
        user_id: userId,
        search_history: [],
        clicked_repos: [],
        saved_items: [],
        theme_preference: 'system'
      });
      
    if (error) throw error;
    return data;
  }
  
  return existingPrefs;
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

// Get user preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
  
  return data;
};

// Update search history
export const addToSearchHistory = async (userId: string, searchItem: SearchHistoryItem) => {
  // Get current preferences
  const userPrefs = await getUserPreferences(userId);
  
  if (!userPrefs) {
    throw new Error('User preferences not found');
  }
  
  // Add to search history (keep most recent 50 searches)
  const updatedHistory = [
    searchItem, 
    ...(userPrefs.search_history || []).slice(0, 49)
  ];
  
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      search_history: updatedHistory,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

// Add to clicked repos
export const addToClickedRepos = async (userId: string, repoId: string) => {
  // Get current preferences
  const userPrefs = await getUserPreferences(userId);
  
  if (!userPrefs) {
    throw new Error('User preferences not found');
  }
  
  // Add to clicked repos if not already present
  const clickedRepos = userPrefs.clicked_repos || [];
  if (!clickedRepos.includes(repoId)) {
    clickedRepos.push(repoId);
  }
  
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      clicked_repos: clickedRepos,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

// Add to saved items
export const addToSavedItems = async (userId: string, itemId: string) => {
  // Get current preferences
  const userPrefs = await getUserPreferences(userId);
  
  if (!userPrefs) {
    throw new Error('User preferences not found');
  }
  
  // Add to saved items if not already present
  const savedItems = userPrefs.saved_items || [];
  if (!savedItems.includes(itemId)) {
    savedItems.push(itemId);
  }
  
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      saved_items: savedItems,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

// Remove from saved items
export const removeFromSavedItems = async (userId: string, itemId: string) => {
  // Get current preferences
  const userPrefs = await getUserPreferences(userId);
  
  if (!userPrefs) {
    throw new Error('User preferences not found');
  }
  
  // Remove from saved items
  const savedItems = (userPrefs.saved_items || []).filter(id => id !== itemId);
  
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      saved_items: savedItems,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

// Set theme preference
export const setThemePreference = async (userId: string, theme: 'light' | 'dark' | 'system') => {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      theme_preference: theme,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

// Keep existing functions
export const saveFeedback = async (feedback: Omit<FeedbackItem, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedback);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

// Function to save feedback that bypasses RLS
export const saveFeedbackRLS = async (feedbackData: any) => {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('feedback')
      .insert(feedbackData)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

export const incrementSearchCount = async (userId: string) => {
  const { data, error } = await supabase.rpc('increment_search_count', {
    user_id: userId
  });
    
  if (error) throw error;
};

export interface ChatMessage {
  id: number;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

/**
 * Save user details to the users table using admin client to bypass RLS
 * @param clerkId The Clerk user ID
 * @param email User's email
 * @param firstName User's first name
 * @param lastName User's last name
 * @param fullName User's full name
 * @param avatarUrl User's avatar URL
 * @param username User's username
 * @returns The created/updated user data
 */
export const saveUserToDatabase = async (
  clerkId: string,
  email: string,
  firstName: string | null = null,
  lastName: string | null = null,
  fullName: string | null = null,
  avatarUrl: string | null = null,
  username: string | null = null
) => {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    const userData = {
      clerk_id: clerkId,
      email: email,
      first_name: firstName || '',
      last_name: lastName || '',
      full_name: fullName || `${firstName || ''} ${lastName || ''}`.trim(),
      avatar_url: avatarUrl || '',
      username: username || email.split('@')[0],
      last_signed_in: new Date().toISOString()
    };
    
    // Use the admin client to insert/update the user
    const { data, error } = await adminClient
      .from('users')
      .upsert(userData, { 
        onConflict: 'clerk_id',
        returning: 'representation'
      });
      
    if (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in saveUserToDatabase:', error);
    throw error;
  }
};

/**
 * Get a user's database ID by their Clerk ID
 * @param clerkId The Clerk user ID
 * @returns The database UUID or null if not found
 */
export const getUserDatabaseId = async (clerkId: string): Promise<string | null> => {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();
      
    if (error) {
      console.error('Error getting user database ID:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getUserDatabaseId:', error);
    return null;
  }
};