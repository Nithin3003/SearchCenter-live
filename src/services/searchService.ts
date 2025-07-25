import axios from 'axios';
import { SearchResult, SearchFilters, defaultSearchFilters } from '../types';

// GitHub API endpoints
const GITHUB_CODE_API = 'https://api.github.com/search/code';
const GITHUB_REPOS_API = 'https://api.github.com/search/repositories';
const STACKOVERFLOW_API = 'https://api.stackexchange.com/2.3/search/advanced';
// API keys
const API_KEY_stack = 'rl_E3Cw6rhQyQHAAhiTbyHKPpX44';
const API_KEY_github = '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';

// Error types for better error handling
export interface SearchError {
  type: 'API_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'NO_RESULTS' | 'UNKNOWN';
  message: string;
  details?: any;
}

// Function to fetch GitHub repository results with enhanced details
async function fetchGitHubRepositories(query: string, filters: SearchFilters = defaultSearchFilters): Promise<SearchResult[]> {
  try {
    // Validate query
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // Construct the GitHub API URL with query and filters
    const url = new URL(GITHUB_REPOS_API);
    
    // Build the query string with filters
    let queryString = query.trim();
    
    // Add language filter if specified
    if (filters.language && filters.language !== 'all') {
      queryString += ` language:${filters.language}`;
    }
    
    // Add sort parameters
    let sort = 'stars';
    let order = 'desc';
    
    if (filters.sortBy === 'recent') {
      sort = 'updated';
    } else if (filters.sortBy === 'relevance') {
      sort = 'score';
    }
    
    // Add time range filter if specified
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let daysAgo;
      
      switch (filters.timeRange) {
        case 'day':
          daysAgo = 1;
          break;
        case 'week':
          daysAgo = 7;
          break;
        case 'month':
          daysAgo = 30;
          break;
        case 'year':
          daysAgo = 365;
          break;
        default:
          daysAgo = 0;
      }
      
      if (daysAgo > 0) {
        const pastDate = new Date(now);
        pastDate.setDate(now.getDate() - daysAgo);
        const dateStr = pastDate.toISOString().split('T')[0];
        queryString += ` pushed:>${dateStr}`;
      }
    }
    
    // Add the query parameters
    url.searchParams.append('q', queryString);
    url.searchParams.append('sort', sort);
    url.searchParams.append('order', order);
    url.searchParams.append('per_page', '15'); // Increased to get more repos
    
    console.log('GitHub repo search URL:', url.toString());

    // Fetch results from GitHub API
    const response = await axios.get(url.toString(), {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${API_KEY_github}`,
        'User-Agent': 'SearchCenter-App'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    const data = response.data;
    
    if (!data || !Array.isArray(data.items)) {
      console.error('Invalid GitHub API response format:', data);
      throw new Error('Invalid response format from GitHub API');
    }

    if (data.items.length === 0) {
      console.log('No repository results found for query:', query);
      return [];
    }
    
    // Map repository results with enhanced details
    return data.items.map((item: any) => ({
      id: `repo-${item.id}`,
      title: item.full_name,
      type: 'repository', // Mark as repository type
      source: item.full_name,
      url: item.html_url,
      description: item.description || 'No description available',
      language: item.language || 'Unknown',
      stars: item.stargazers_count,
      forks: item.forks_count,
      watchers: item.watchers_count,
      timestamp: item.updated_at,
      owner: {
        login: item.owner.login,
        avatar_url: item.owner.avatar_url,
        url: item.owner.html_url
      },
      topics: item.topics || [],
      openIssues: item.open_issues_count,
      license: item.license ? item.license.name : null
    })) as SearchResult[];
  } catch (error: any) {
    console.error('Error fetching GitHub repository results:', error);
    
    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('GitHub API authentication failed. Please check your API token.');
      } else if (status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      } else if (status === 422) {
        throw new Error('Invalid search query. Please check your search terms.');
      } else {
        throw new Error(`GitHub API error (${status}): ${error.response.data?.message || error.message}`);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

// Function to fetch GitHub code search results with enhanced snippets
async function fetchGitHubCodeSnippets(query: string, filters: SearchFilters = defaultSearchFilters): Promise<SearchResult[]> {
  try {
    // Validate query
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // Construct the GitHub Code Search API URL
    const url = new URL(GITHUB_CODE_API);
    
    // Build the query string with filters
    let queryString = query.trim();
    
    // Add language filter if specified
    if (filters.language && filters.language !== 'all') {
      queryString += ` language:${filters.language}`;
    }
    
    // Add the query parameters
    url.searchParams.append('q', queryString);
    url.searchParams.append('per_page', '15'); // Increased to get more diverse results
    
    console.log('GitHub code search URL:', url.toString());
    
    // First fetch code search results
    const response = await axios.get(url.toString(), {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${API_KEY_github}`,
        'User-Agent': 'SearchCenter-App'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    const data = response.data;
    
    if (!data || !Array.isArray(data.items)) {
      console.error('Invalid GitHub API response format:', data);
      throw new Error('Invalid response format from GitHub API');
    }

    if (data.items.length === 0) {
      console.log('No code results found for query:', query);
      return [];
    }
    
    // Process each code result to get the actual content with line numbers
    const codeResults = await Promise.all(data.items.map(async (item: any) => {
      // Get repository and file path details
      const repoFullName = item.repository.full_name;
      const [owner, repo] = repoFullName.split('/');
      const filePath = item.path;
      
      try {
        // Fetch the actual file content
        const contentResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers: {
            'Accept': 'application/vnd.github.v3.raw',
            'Authorization': `token ${API_KEY_github}`,
            'User-Agent': 'SearchCenter-App'
          },
          timeout: 5000 // 5 second timeout for file content
        });
        
        if (contentResponse.status !== 200) {
          throw new Error(`Failed to fetch file content: ${contentResponse.statusText}`);
        }
        
        // Get file content as text
        const fileContent = contentResponse.data;
        
        // Split into lines for processing
        const lines = typeof fileContent === 'string' ? fileContent.split('\n') : [];
        
        // Get the file extension for language detection
        const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
        let language = item.language || fileExt || 'Unknown';
        
        // Find lines that match the query
        const queryTerms = query.trim().split(/\s+/).filter(term => term.length > 2);
        const queryRegex = new RegExp(
          queryTerms.map(term => `(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('|'), 
          'i'
        );
        
        // Find matching line numbers
        const matchingLineIndices: number[] = [];
        lines.forEach((line, index) => {
          if (queryRegex.test(line)) {
            matchingLineIndices.push(index);
          }
        });
        
        // If no matches found, just return the first few lines
        if (matchingLineIndices.length === 0) {
          const snippetLines = lines.slice(0, 10);
          const lineNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
          
          return {
            id: `${item.repository.id}-${item.sha}`,
            title: `${repoFullName}`,
            type: 'code',
            source: repoFullName,
            url: item.html_url,
            path: filePath,
            snippet: snippetLines.join('\n'),
            lineNumbers: lineNumbers,
            language: language,
            timestamp: item.repository.updated_at || new Date().toISOString(),
            stars: item.repository.stargazers_count,
            owner: {
              login: item.repository.owner.login,
              avatar_url: item.repository.owner.avatar_url
            }
          };
        }
        
        // Get context around each match (up to 2 lines before and after)
        const contextSize = 2;
        const snippetLines: string[] = [];
        const lineNumbers: number[] = [];
        
        let lastLineAdded = -1;
        
        for (const matchedLine of matchingLineIndices) {
          const startLine = Math.max(0, matchedLine - contextSize);
          const endLine = Math.min(lines.length - 1, matchedLine + contextSize);
          
          // If this snippet would overlap with the previous one, merge them
          if (startLine <= lastLineAdded + 1) {
            // Add lines from lastLineAdded+1 to endLine
            for (let i = lastLineAdded + 1; i <= endLine; i++) {
              snippetLines.push(lines[i]);
              lineNumbers.push(i + 1);
            }
          } else {
            // Add a separator if this isn't the first snippet
            if (snippetLines.length > 0) {
              snippetLines.push('...');
              lineNumbers.push(-1); // Use -1 to indicate a separator
            }
            
            // Add the new snippet
            for (let i = startLine; i <= endLine; i++) {
              snippetLines.push(lines[i]);
              lineNumbers.push(i + 1);
            }
          }
          
          lastLineAdded = endLine;
        }
        
        return {
          id: `${item.repository.id}-${item.sha}`,
          title: `${repoFullName}`,
          type: 'code',
          source: repoFullName,
          url: item.html_url,
          path: filePath,
          snippet: snippetLines.join('\n'),
          lineNumbers: lineNumbers,
          language: language,
          timestamp: item.repository.updated_at || new Date().toISOString(),
          stars: item.repository.stargazers_count,
          owner: {
            login: item.repository.owner.login,
            avatar_url: item.repository.owner.avatar_url
          }
        };
      } catch (contentError) {
        console.error(`Error fetching file content for ${repoFullName}/${filePath}:`, contentError);
        return null;
      }
    }));
    
    return codeResults.filter(result => result !== null) as SearchResult[];
  } catch (error: any) {
    console.error('Error fetching GitHub code search results:', error);
    
    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('GitHub API authentication failed. Please check your API token.');
      } else if (status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      } else if (status === 422) {
        throw new Error('Invalid search query. Please check your search terms.');
      } else {
        throw new Error(`GitHub API error (${status}): ${error.response.data?.message || error.message}`);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

// Enhance the fetchSearchResults function to better combine code and repo results
export async function fetchSearchResults(query: string, filters: SearchFilters = defaultSearchFilters): Promise<SearchResult[]> {
  try {
    console.log('Searching with query:', query, 'and filters:', filters);
    
    // Validate input
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // Create an array to track the API sources used
    const apiSources = [
      { name: 'GitHub Code API', url: GITHUB_CODE_API },
      { name: 'GitHub Repositories API', url: GITHUB_REPOS_API }
    ];

    let githubRepos: SearchResult[] = [];
    let codeSnippets: SearchResult[] = [];
    let errors: string[] = [];

    // Try to fetch both GitHub repository results and code snippets
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      fetchGitHubRepositories(query, filters),
      fetchGitHubCodeSnippets(query, filters)
    ]);

    // Process repository results
    if (results[0].status === 'fulfilled') {
      githubRepos = results[0].value;
    } else {
      console.error('Repository search failed:', results[0].reason);
      errors.push(`Repository search: ${results[0].reason.message}`);
    }

    // Process code search results
    if (results[1].status === 'fulfilled') {
      codeSnippets = results[1].value;
    } else {
      console.error('Code search failed:', results[1].reason);
      errors.push(`Code search: ${results[1].reason.message}`);
    }

    console.log(`Found ${githubRepos.length} repository results and ${codeSnippets.length} code snippet results`);

    // If both searches failed, throw an error
    if (githubRepos.length === 0 && codeSnippets.length === 0) {
      if (errors.length > 0) {
        throw new Error(`Search failed: ${errors.join('; ')}`);
      } else {
        throw new Error('No results found for your search query. Try different search terms.');
      }
    }
    
    // Add API source information to results
    const repoResults = githubRepos.map(repo => ({
      ...repo,
      apiSource: apiSources[1]
    }));
    
    const codeResults = codeSnippets.map(code => ({
      ...code,
      apiSource: apiSources[0]
    }));
    
    // Combine and enrich code results with repository metadata
    let combinedResults: SearchResult[] = [];
    
    // Add the top repositories first
    if (repoResults.length > 0) {
      combinedResults.push(...repoResults.slice(0, 3));
    }
    
    // Initialize a mapping of repository sources to their data for quick lookup
    const repoDataMap = new Map();
    repoResults.forEach(repo => {
      repoDataMap.set(repo.source, repo);
    });
    
    // Process code results, enriching them with repository data
    const enrichedCodeResults = codeResults.map(codeResult => {
      if (codeResult.source) {
        const matchingRepo = repoDataMap.get(codeResult.source);
        if (matchingRepo) {
          // Enhance code result with repository metadata
          return {
            ...codeResult,
            stars: matchingRepo.stars,
            forks: matchingRepo.forks,
            watchers: matchingRepo.watchers,
            openIssues: matchingRepo.openIssues,
            license: matchingRepo.license,
            topics: matchingRepo.topics,
            // Mark this as having matched repo data
            hasRepoData: true
          };
        }
      }
      return codeResult;
    });
    
    // Add the enriched code results
    combinedResults.push(...enrichedCodeResults);
    
    // Add any remaining repositories
    if (repoResults.length > 3) {
      combinedResults.push(...repoResults.slice(3));
    }
    
    // Add a unified result score for better UI sorting
    combinedResults = combinedResults.map(result => {
      const score = calculateCombinedScore(result, query);
      return { ...result, score };
    });
    
    // Add metadata about the search
    const searchMeta = {
      totalResults: combinedResults.length,
      apiSources: apiSources,
      timeTaken: new Date().getTime(), // Could track actual time taken
      query,
      filters
    };
    
    console.log('Search metadata:', searchMeta);
    
    return combinedResults;
  } catch (error: any) {
    console.error('Error fetching combined search results:', error);
    
    // Throw a more user-friendly error message
    if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected error occurred while searching. Please try again.');
    }
  }
}

// Calculate a unified score for better sorting of combined results
function calculateCombinedScore(result: SearchResult, query: string): number {
  let score = 0;
  
  // Base score from stars, if available
  if (result.stars) {
    score += Math.min(result.stars / 100, 50); // Cap at 50 points from stars
  }
  
  // Boost repositories slightly
  if (result.type === 'repository') {
    score += 10;
  }
  
  // Boost code results that have repository data
  if (result.type === 'code' && (result as any).hasRepoData) {
    score += 5;
  }
  
  // Boost based on text match relevance
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  // Title match is important
  if (result.title) {
    const titleLower = result.title.toLowerCase();
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += 15;
        // Exact title match is even better
        if (titleLower === term) {
          score += 10;
        }
      }
    });
  }
  
  // Description match
  if (result.description) {
    const descLower = result.description.toLowerCase();
    queryTerms.forEach(term => {
      if (descLower.includes(term)) {
        score += 5;
      }
    });
  }
  
  // Code snippet match
  if (result.snippet) {
    const snippetLower = result.snippet.toLowerCase();
    queryTerms.forEach(term => {
      // Count occurrences in snippet
      const occurrences = (snippetLower.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(occurrences * 2, 20); // Cap at 20 points from snippet matches
    });
  }
  
  // Recent updates give a small boost
  if (result.timestamp) {
    const now = new Date();
    const updateDate = new Date(result.timestamp);
    const daysSinceUpdate = (now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 7) {
      score += 10; // Updated in the last week
    } else if (daysSinceUpdate < 30) {
      score += 5; // Updated in the last month
    } else if (daysSinceUpdate < 90) {
      score += 2; // Updated in the last 3 months
    }
  }
  
  return score;
}