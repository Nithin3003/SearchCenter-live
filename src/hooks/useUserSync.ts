import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { createAdminClient } from '../lib/supabase';

/**
 * Custom hook to sync Clerk user data to Supabase database
 * This ensures all new users are properly stored in the database
 */
export function useUserSync() {
  const { user, isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Only run this effect when the user data is loaded and user is signed in
    if (!isLoaded || !isSignedIn || !user) return;

    const syncUserToDatabase = async () => {
      try {
        const adminClient = createAdminClient();
        
        // Extract relevant user data from Clerk
        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          avatar_url: user.imageUrl,
          last_signed_in: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        // Check if user already exists in our database
        const { data: existingUser, error: fetchError } = await adminClient
          .from('users')
          .select('id, clerk_id, last_signed_in')
          .eq('clerk_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error checking for existing user:', fetchError);
          return;
        }

        if (existingUser) {
          // User exists, update last_signed_in
          const { error: updateError } = await adminClient
            .from('users')
            .update({ 
              last_signed_in: new Date().toISOString(),
              email: user.primaryEmailAddress?.emailAddress, // Update email in case it changed
              first_name: user.firstName, 
              last_name: user.lastName,
              avatar_url: user.imageUrl
            })
            .eq('clerk_id', user.id);

          if (updateError) {
            console.error('Error updating user:', updateError);
          } else {
            console.log('User sign-in time updated');
          }
        } else {
          // User doesn't exist, create new user
          const { data, error: insertError } = await adminClient
            .from('users')
            .insert(userData)
            .select();

          if (insertError) {
            console.error('Error creating new user:', insertError);
          } else {
            console.log('New user created in database', data);
            
            // Send welcome notification to new user
            const { error: notificationError } = await adminClient
              .from('notifications')
              .insert({
                user_id: user.id,
                title: 'Welcome to SearchCenter',
                content: 'Thank you for signing up! Get started by searching for useful coding examples and resources.',
                type: 'system',
                read: false,
                created_at: new Date().toISOString()
              });

            if (notificationError) {
              console.error('Error sending welcome notification:', notificationError);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing user to database:', err);
      }
    };

    syncUserToDatabase();
  }, [user, isSignedIn, isLoaded]);

  return null;
}