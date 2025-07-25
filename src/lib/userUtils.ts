import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { saveUserToDatabase, createAdminClient } from './supabase';

// Create a cache to prevent repeated syncs within the same session
const syncedUsers = new Set<string>();

/**
 * Syncs the current Clerk user details to the Supabase user_profile table
 * @param user The Clerk user object
 * @param forceSync Force sync even if user is in the cache
 * @returns A promise that resolves to the user ID or null if sync failed
 */
export const syncClerkUserToProfile = async (
  user: any, 
  forceSync = false
): Promise<string | null> => {
  try {
    if (!user) {
      console.error('No user provided to syncClerkUserToProfile');
      return null;
    }

    // Check if this user is already in our database first
    // This avoids unnecessary write operations
    const existingUserId = await getUserDatabaseId(user.id);
    
    // If user already exists and we're not forcing a sync,
    // just return the existing ID and add to cache
    if (existingUserId && !forceSync) {
      syncedUsers.add(user.id); // Add to cache
      return existingUserId;
    }
    
    // Check cache to avoid multiple syncs within the same session
    if (syncedUsers.has(user.id) && !forceSync) {
      return await getUserDatabaseId(user.id);
    }

    // Get primary email address
    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    
    if (!primaryEmail) {
      console.error('User has no primary email address');
      return null;
    }

    // Format the user's full name
    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    // Save user to database using admin client to bypass RLS
    try {
      await saveUserToDatabase(
        user.id,
        primaryEmail,
        user.firstName,
        user.lastName,
        fullName,
        user.imageUrl,
        user.username
      );
      
      // Get the database UUID
      const databaseUserId = await getUserDatabaseId(user.id);
      
      // Add to synced cache to prevent future unnecessary syncs
      if (databaseUserId) {
        syncedUsers.add(user.id);
      }
      
      return databaseUserId;
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return null;
    }
  } catch (error) {
    console.error('Error syncing user to profile:', error);
    return null;
  }
};

/**
 * React hook that syncs the current user's details to the user_profile table
 * and returns the sync status
 * 
 * @returns Object containing sync status information
 */
export function useSyncUserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Use this ref to prevent multiple effect executions
  const syncAttempted = useState<boolean>(false);

  useEffect(() => {
    // Skip if Clerk isn't loaded yet or user isn't signed in
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }
    
    // Skip if we're already syncing or have successfully synced
    if (isSyncing || isSynced || syncAttempted[0]) {
      return;
    }

    const syncUser = async () => {
      try {
        setIsSyncing(true);
        syncAttempted[1](true); // Mark that we've attempted a sync
        setError(null);
        
        // First check if we already have this user's ID (avoid sync)
        const existingId = await getUserDatabaseId(user.id);
        
        if (existingId) {
          // User already exists, no need to sync
          setUserId(existingId);
          setIsSynced(true);
          syncedUsers.add(user.id); // Add to cache
          return;
        }
        
        // User doesn't exist, sync them
        const id = await syncClerkUserToProfile(user);
        
        if (id) {
          setUserId(id);
          setIsSynced(true);
        } else {
          throw new Error('Failed to sync user profile');
        }
      } catch (err) {
        console.error('Error in useSyncUserProfile:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsSynced(false);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, isSyncing, isSynced, syncAttempted]);

  return { userId, isSynced, isSyncing, error };
}

/**
 * Component that automatically syncs the current user to the user_profile table
 * Can be used at the top level of your app to ensure the user is always synced
 */
export function UserProfileSync({ children }: { children: React.ReactNode }) {
  const { isSynced, isSyncing, error } = useSyncUserProfile();

  // Optionally handle sync error
  if (error) {
    console.error('User profile sync error:', error);
  }

  return children;
}

/**
 * Retrieves the database ID for a given Clerk user ID
 * @param clerkId The Clerk user ID
 * @returns A promise that resolves to the database ID or null if not found
 */
export const getUserDatabaseId = async (clerkId: string): Promise<string | null> => {
  try {
    if (!clerkId) return null;
    
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    // Look up user by clerk_id
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();
    
    if (error) {
      console.error('Error looking up user by clerk_id:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getUserDatabaseId:', error);
    return null;
  }
};

