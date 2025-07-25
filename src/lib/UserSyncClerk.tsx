import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

/**
 * React hook for displaying user details in client components with Vite
 * @returns Object containing user details loading state and any error
 * 
 * Usage example in a Vite TSX component:
 * 
 * import { useUserDetails } from '@/lib/userUtils';
 * 
 * function ProfileComponent() {
 *   const { userDetails, isLoading, error } = useUserDetails();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!userDetails) return <div>User not authenticated</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {userDetails.fullName}</h1>
 *       <img src={userDetails.imageUrl} alt="Profile" />
 *       <p>Email: {userDetails.email}</p>
 *     </div>
 *   );
 * }
 */
export function useUserDetails() {
  const { isLoaded, isSignedIn, user } = useUser();
  type UserDetails = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    email: string | undefined;
    imageUrl: string;
    username: string | null;
    createdAt: Date;
    lastSignInAt: Date | null;
  };
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setUserDetails(null);
      setIsLoading(false);
      return;
    }

    try {
      // Format user details
      const details = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.primaryEmailAddress?.emailAddress,
        imageUrl: user.imageUrl,
        username: user.username,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      };
      
      setUserDetails(details);
      setError(null);
    } catch (err) {
      console.error('Error processing user details:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  return { userDetails, isLoading, error };
}