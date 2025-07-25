import axios from 'axios';

/**
 * Fetches query suggestions based on user input from a Gemini AI model
 * @param query The partial query text entered by the user
 * @returns An array of suggested search queries
 */
export async function fetchQuerySuggestions(query: string): Promise<string[]> {
  try {
    // In a real implementation, you would call an API endpoint that interacts with Gemini AI
    // For now, we'll return mock suggestions based on the input query
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate suggestions based on the input query
    const suggestions = generateSuggestions(query);
    return suggestions;
  } catch (error) {
    console.error('Error fetching query suggestions:', error);
    return [];
  }
}

/**
 * Generates mock suggestions based on the input query
 * This would be replaced with actual AI-generated suggestions in production
 */
function generateSuggestions(query: string): string[] {
  const queryLower = query.toLowerCase();
  
  // Common programming topics to suggest
  const commonProgrammingTopics = [
    'javascript',
    'typescript',
    'react hooks',
    'react components',
    'node.js',
    'express',
    'graphql',
    'python',
    'django',
    'flutter',
    'golang',
    'rust',
    'authentication',
    'database',
    'api',
    'testing',
    'performance',
    'optimization',
  ];
  
  // Filter topics that match the query
  const matchingTopics = commonProgrammingTopics.filter(topic => 
    topic.includes(queryLower)
  );
  
  // Generate specific suggestions based on the query
  let suggestions: string[] = [];
  
  if (queryLower.includes('javascript') || queryLower.includes('js')) {
    suggestions = [
      `${query} best practices`,
      `${query} tutorial`,
      `${query} examples`,
      `${query} vs typescript`,
      `${query} interview questions`,
    ];
  } else if (queryLower.includes('react')) {
    suggestions = [
      `${query} hooks tutorial`,
      `${query} state management`,
      `${query} performance tips`,
      `${query} with typescript`,
      `${query} component patterns`,
    ];
  } else if (queryLower.includes('python')) {
    suggestions = [
      `${query} for beginners`,
      `${query} data science`,
      `${query} vs javascript`,
      `${query} machine learning`,
      `${query} web scraping`,
    ];
  } else {
    // Generic programming-related suggestions
    suggestions = [
      `${query} tutorial`,
      `${query} best practices`,
    ];
  }
  
  // Combine filtered topics and generated suggestions
  const allSuggestions = [...matchingTopics, ...suggestions];
  
  // Remove duplicates and limit to 5 suggestions
  return Array.from(new Set(allSuggestions))
    .filter(suggestion => suggestion !== query) // Remove exact matches
    .slice(0, 5);
}