import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { saveUserProfile, syncUserWithSupabase } from '../lib/supabase';

export function useSupabaseSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isSupabaseSynced, setIsSupabaseSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const syncUserData = async () => {
      if (!isLoaded || !user) return;

      try {
        setIsSyncing(true);
        // Get JWT for Supabase
        const token = await getToken({ template: 'supabase' });
        
        if (!token) {
          throw new Error('Failed to get token for Supabase');
        }

        // Sync auth with Supabase
        await syncUserWithSupabase(token);

        // Save user profile data
        const emailAddress = user.emailAddresses[0]?.emailAddress;
        
        if (!emailAddress) {
          throw new Error('User email not available');
        }

        await saveUserProfile(
          user.id,
          emailAddress,
          user.firstName,
          user.lastName,
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
          user.imageUrl,
          user.username || emailAddress.split('@')[0]
        );

        setIsSupabaseSynced(true);
      } catch (err) {
        console.error('Error syncing with Supabase:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsSyncing(false);
      }
    };

    syncUserData();
  }, [user, isLoaded, getToken]);

  return { isSupabaseSynced, isSyncing, error };
}