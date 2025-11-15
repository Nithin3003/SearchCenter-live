import axios from 'axios';
import { SearchResult, SearchFilters } from './enhancedSearchService';
import { enhancedSearchService } from './enhancedSearchService';

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
  prerequisites: string[];
  learningObjectives: string[];
}

export interface ResourceRecommendation {
  resource: SearchResult;
  relevanceScore: number;
  reason: string;
  category: 'code' | 'video' | 'dataset' | 'paper';
}

export interface ProjectPlan {
  id: string;
  idea: ProjectIdea;
  resources: ResourceRecommendation[];
  phases: ProjectPhase[];
  complexity: number;
  estimatedDuration: string;
  skills: string[];
  createdAt: string;
}

export interface ProjectPhase {
  id: string;
  title: string;
  description: string;
  resources: ResourceRecommendation[];
  estimatedTime: string;
  order: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  phases: LearningPathPhase[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
}

export interface LearningPathPhase {
  id: string;
  title: string;
  description: string;
  resources: ResourceRecommendation[];
  skills: string[];
  order: number;
}

class GeminiProjectService {
  private apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  async generateProjectIdeas(query: string, userSkillLevel?: 'beginner' | 'intermediate' | 'advanced'): Promise<ProjectIdea[]> {
    try {
      const prompt = `
        Based on the user query: "${query}"

        Generate 3-5 project ideas suitable for a ${userSkillLevel || 'intermediate'} developer.
        For each idea, provide:
        1. A catchy, descriptive title
        2. A detailed description (2-3 sentences)
        3. Difficulty level (beginner/intermediate/advanced)
        4. Estimated completion time
        5. Relevant tags (5-7 tags)
        6. Prerequisites (3-5 items)
        7. Learning objectives (3-5 objectives)

        Format as JSON array with the following structure:
        {
          "title": "...",
          "description": "...",
          "difficulty": "...",
          "estimatedTime": "...",
          "tags": ["...", "..."],
          "prerequisites": ["...", "..."],
          "learningObjectives": ["...", "..."]
        }
      `;

      const response = await this.callGemini(prompt);
      return this.parseProjectIdeas(response);
    } catch (error) {
      console.error('Failed to generate project ideas:', error);
      throw new Error('Failed to generate project ideas');
    }
  }

  async generateResourceRecommendations(projectIdea: ProjectIdea): Promise<ResourceRecommendation[]> {
    try {
      // Search for relevant resources across all categories
      const searches = await Promise.all([
        enhancedSearchService.searchCode(projectIdea.title, {}),
        enhancedSearchService.searchVideos(projectIdea.title + ' tutorial', {}),
        enhancedSearchService.searchDatasets(projectIdea.title, {}),
        enhancedSearchService.searchPapers(projectIdea.title, {}),
      ]);

      const allResources = [
        ...searches.code.results.map(r => ({ ...r, category: 'code' as const })),
        ...searches.videos.results.map(r => ({ ...r, category: 'video' as const })),
        ...searches.datasets.results.map(r => ({ ...r, category: 'dataset' as const })),
        ...searches.papers.results.map(r => ({ ...r, category: 'paper' as const })),
      ];

      // Use AI to rank and filter resources
      const prompt = `
        Given the project idea:
        Title: "${projectIdea.title}"
        Description: "${projectIdea.description}"
        Tags: ${projectIdea.tags.join(', ')}

        Rank the following resources based on their relevance to this project idea.
        For each resource, provide:
        1. Relevance score (0-1)
        2. Reason for recommendation (1-2 sentences)
        3. Category (code/video/dataset/paper)

        Resources to evaluate:
        ${allResources.map(resource =>
          `- ${resource.title}: ${resource.description || 'No description'}`
        ).join('\n')}

        Format as JSON array with structure:
        {
          "resourceId": "...",
          "relevanceScore": 0.9,
          "reason": "...",
          "category": "..."
        }

        Include only the top 10 most relevant resources.
      `;

      const aiResponse = await this.callGemini(prompt);
      const rankings = this.parseResourceRankings(aiResponse);

      // Map rankings back to resources
      return rankings.map(ranking => {
        const resource = allResources.find(r => r.id === ranking.resourceId);
        if (!resource) return null;

        return {
          resource,
          relevanceScore: ranking.relevanceScore,
          reason: ranking.reason,
          category: ranking.category,
        };
      }).filter(Boolean) as ResourceRecommendation[];
    } catch (error) {
      console.error('Failed to generate resource recommendations:', error);
      throw new Error('Failed to generate resource recommendations');
    }
  }

  async generateProjectPlan(projectIdea: ProjectIdea, resources: ResourceRecommendation[]): Promise<ProjectPlan> {
    try {
      const prompt = `
        Create a detailed project plan for:
        Title: "${projectIdea.title}"
        Description: "${projectIdea.description}"
        Difficulty: ${projectIdea.difficulty}
        Estimated Time: ${projectIdea.estimatedTime}

        Available Resources:
        ${resources.map(r => `- ${r.resource.title} (${r.category}): ${r.reason}`).join('\n')}

        Create a project plan with:
        1. 3-5 logical phases
        2. Each phase should have specific resources assigned
        3. Estimated time for each phase
        4. Skills that will be learned

        Format as JSON:
        {
          "phases": [
            {
              "title": "...",
              "description": "...",
              "resourceIds": ["...", "..."],
              "estimatedTime": "...",
              "order": 1,
              "skills": ["...", "..."]
            }
          ],
          "complexity": 0.7,
          "estimatedDuration": "...",
          "skills": ["...", "..."]
        }
      `;

      const response = await this.callGemini(prompt);
      return this.parseProjectPlan(response, projectIdea, resources);
    } catch (error) {
      console.error('Failed to generate project plan:', error);
      throw new Error('Failed to generate project plan');
    }
  }

  async generateLearningPath(topic: string, skillLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<LearningPath> {
    try {
      const prompt = `
        Create a comprehensive learning path for: "${topic}" at ${skillLevel} level.

        Generate 4-6 progressive phases that build upon each other.
        Each phase should include:
        1. Clear learning objectives
        2. Recommended resources (concepts to learn)
        3. Skills to acquire
        4. Estimated duration

        Format as JSON:
        {
          "title": "...",
          "description": "...",
          "phases": [
            {
              "title": "...",
              "description": "...",
              "learningObjectives": ["...", "..."],
              "skills": ["...", "..."],
              "estimatedDuration": "...",
              "order": 1
            }
          ],
          "skillLevel": "...",
          "duration": "..."
        }
      `;

      const response = await this.callGemini(prompt);
      return this.parseLearningPath(response, topic);
    } catch (error) {
      console.error('Failed to generate learning path:', error);
      throw new Error('Failed to generate learning path');
    }
  }

  async combineResources(resources: ResourceRecommendation[], goal: string): Promise<{
    combination: string;
    workflow: string[];
    benefits: string[];
    challenges: string[];
  }> {
    try {
      const prompt = `
        I want to combine these resources to achieve the goal: "${goal}"

        Resources:
        ${resources.map(r => `- ${r.resource.title} (${r.category})`).join('\n')}

        Provide:
        1. How these resources can be combined effectively
        2. Step-by-step workflow for integration
        3. Expected benefits of this combination
        4. Potential challenges and how to overcome them

        Format as JSON:
        {
          "combination": "...",
          "workflow": ["...", "..."],
          "benefits": ["...", "..."],
          "challenges": ["...", "..."]
        }
      `;

      const response = await this.callGemini(prompt);
      return this.parseResourceCombination(response);
    } catch (error) {
      console.error('Failed to combine resources:', error);
      throw new Error('Failed to combine resources');
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}?key=${this.apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private parseProjectIdeas(response: string): ProjectIdea[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const ideas = JSON.parse(jsonMatch[0]);
      return ideas.map((idea: any, index: number) => ({
        id: `idea-${index}`,
        title: idea.title || 'Untitled Project',
        description: idea.description || '',
        difficulty: idea.difficulty || 'intermediate',
        estimatedTime: idea.estimatedTime || 'Unknown',
        tags: Array.isArray(idea.tags) ? idea.tags : [],
        prerequisites: Array.isArray(idea.prerequisites) ? idea.prerequisites : [],
        learningObjectives: Array.isArray(idea.learningObjectives) ? idea.learningObjectives : [],
      }));
    } catch (error) {
      console.error('Failed to parse project ideas:', error);
      return [];
    }
  }

  private parseResourceRankings(response: string): any[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse resource rankings:', error);
      return [];
    }
  }

  private parseProjectPlan(response: string, idea: ProjectIdea, resources: ResourceRecommendation[]): ProjectPlan {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const plan = JSON.parse(jsonMatch[0]);

      return {
        id: `plan-${idea.id}`,
        idea,
        resources,
        phases: plan.phases.map((phase: any, index: number) => ({
          id: `phase-${index}`,
          title: phase.title || `Phase ${index + 1}`,
          description: phase.description || '',
          resources: phase.resourceIds?.map((id: string) =>
            resources.find(r => r.resource.id === id)
          ).filter(Boolean) || [],
          estimatedTime: phase.estimatedTime || 'Unknown',
          order: phase.order || index + 1,
        })),
        complexity: plan.complexity || 0.5,
        estimatedDuration: plan.estimatedDuration || 'Unknown',
        skills: Array.isArray(plan.skills) ? plan.skills : [],
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse project plan:', error);
      throw new Error('Failed to parse project plan');
    }
  }

  private parseLearningPath(response: string, topic: string): LearningPath {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const path = JSON.parse(jsonMatch[0]);

      return {
        id: `path-${Date.now()}`,
        title: path.title || topic,
        description: path.description || '',
        phases: path.phases.map((phase: any, index: number) => ({
          id: `path-phase-${index}`,
          title: phase.title || `Phase ${index + 1}`,
          description: phase.description || '',
          resources: [], // Would need to map learning objectives to actual resources
          skills: Array.isArray(phase.skills) ? phase.skills : [],
          order: phase.order || index + 1,
        })),
        skillLevel: path.skillLevel || 'intermediate',
        duration: path.duration || 'Unknown',
      };
    } catch (error) {
      console.error('Failed to parse learning path:', error);
      throw new Error('Failed to parse learning path');
    }
  }

  private parseResourceCombination(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse resource combination:', error);
      return {
        combination: 'Unable to determine combination strategy',
        workflow: [],
        benefits: [],
        challenges: [],
      };
    }
  }
}

export const geminiProjectService = new GeminiProjectService();