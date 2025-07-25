import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { searchService } from '../services/search-service';
import { getUserDatabaseId } from '../lib/userUtils'; // Add this import

interface FeedbackFormProps {
  currentUrl?: string;
  onSubmitSuccess?: () => void;
  className?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ 
  currentUrl, 
  onSubmitSuccess,
  className = "" 
}) => {
  const { user } = useUser();
  const [feedbackType, setFeedbackType] = useState('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [databaseUserId, setDatabaseUserId] = useState<string | null>(null);

  // Get the proper database UUID for the user
  useEffect(() => {
    if (user?.id) {
      const fetchUserId = async () => {
        try {
          const dbUserId = await getUserDatabaseId(user.id);
          setDatabaseUserId(dbUserId);
        } catch (err) {
          console.error('Error fetching database user ID:', err);
          // We'll handle the case where user ID isn't found during form submission
        }
      };
      
      fetchUserId();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get the user's database ID
      let userIdToUse = null;
      if (user?.id) {
        userIdToUse = await getUserDatabaseId(user.id);
      }
      
      // Create feedback data with properly formatted fields
      const feedbackData = {
        user_id: userIdToUse,
        feedback_type: feedbackType,
        content: message.trim(),
        rating: rating || null,
        email: user?.emailAddresses?.[0]?.emailAddress || 'anonymous@example.com',
        resolved: false
      };
      
      try {
        await searchService.saveFeedback(feedbackData);
      } catch (apiError) {
        // If the API key error occurs, try an alternative approach
        if (apiError.message?.includes('Invalid API key') || 
            apiError.message?.includes('Authentication error')) {
          
          console.warn('Falling back to anonymous feedback submission');
          
          // Use the regular client with null user_id as fallback
          const anonFeedback = {
            ...feedbackData,
            user_id: null // Force anonymous feedback
          };
          
          await searchService.saveAnonymousFeedback(anonFeedback);
        } else {
          throw apiError; // Re-throw other errors
        }
      }
      
      setSuccess(true);
      setMessage('');
      setRating(undefined);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Feedback</h2>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Thank you for your feedback!</h3>
          <p className="text-gray-600">We appreciate your input and will use it to improve our service.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 mb-1">
              Type of Feedback
            </label>
            <select 
              id="feedback-type"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              disabled={isSubmitting}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="question">Question</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              placeholder="Please share your thoughts..."
              required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {(feedbackType === 'general' || feedbackType === 'bug') && (
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    disabled={isSubmitting}
                    className={`h-10 w-10 rounded ${
                      rating === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } flex items-center justify-center font-medium transition-colors`}
                    aria-label={`Rate ${num} out of 5`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting || !message.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;