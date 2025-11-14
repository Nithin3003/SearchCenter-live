import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Target,
  Lightbulb,
  BookOpen,
  Clock,
  BarChart3,
  Users,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Code2,
  PlayCircle,
  Database,
  FileText
} from 'lucide-react';
import {
  geminiProjectService,
  ProjectIdea,
  ProjectPlan,
  ResourceRecommendation,
  LearningPath
} from '../../services/geminiProjectService';
import { SearchResult } from '../../services/enhancedSearchService';

interface AIProjectBuilderProps {
  onClose?: () => void;
  onProjectCreated?: (project: ProjectPlan) => void;
}

type Mode = 'ideas' | 'resources' | 'plan' | 'path';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export default function AIProjectBuilder({ onClose, onProjectCreated }: AIProjectBuilderProps) {
  const [mode, setMode] = useState<Mode>('ideas');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [resourceRecommendations, setResourceRecommendations] = useState<ResourceRecommendation[]>([]);
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const generateProjectIdeas = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ideas = await geminiProjectService.generateProjectIdeas(query, skillLevel);
      setProjectIdeas(ideas);
    } catch (error: any) {
      setError(error.message || 'Failed to generate project ideas');
    } finally {
      setLoading(false);
    }
  };

  const selectProjectIdea = async (idea: ProjectIdea) => {
    setSelectedIdea(idea);
    setLoading(true);

    try {
      const recommendations = await geminiProjectService.generateResourceRecommendations(idea);
      setResourceRecommendations(recommendations);
      setMode('resources');
    } catch (error: any) {
      setError(error.message || 'Failed to generate resource recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateProjectPlan = async () => {
    if (!selectedIdea || selectedResources.size === 0) return;

    setLoading(true);
    setError(null);

    try {
      const selectedRecs = resourceRecommendations.filter(r =>
        selectedResources.has(r.resource.id)
      );

      const plan = await geminiProjectService.generateProjectPlan(selectedIdea, selectedRecs);
      setProjectPlan(plan);
      setMode('plan');
    } catch (error: any) {
      setError(error.message || 'Failed to generate project plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  const getResourceIcon = (category: string) => {
    switch (category) {
      case 'code': return Code2;
      case 'video': return PlayCircle;
      case 'dataset': return Database;
      case 'paper': return FileText;
      default: return Sparkles;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const exportProjectPlan = () => {
    if (!projectPlan) return;

    const markdown = this.convertToMarkdown(projectPlan);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectPlan.idea.title.replace(/\s+/g, '_')}_project_plan.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToMarkdown = (plan: ProjectPlan): string => {
    let markdown = `# ${plan.idea.title}\n\n`;
    markdown += `**Description:** ${plan.idea.description}\n\n`;
    markdown += `**Difficulty:** ${plan.idea.difficulty}\n\n`;
    markdown += `**Estimated Time:** ${plan.estimatedDuration}\n\n`;
    markdown += `**Skills:** ${plan.skills.join(', ')}\n\n`;

    markdown += `## Prerequisites\n\n`;
    plan.idea.prerequisites.forEach(prereq => {
      markdown += `- ${prereq}\n`;
    });
    markdown += '\n';

    markdown += `## Project Phases\n\n`;
    plan.phases.forEach((phase, index) => {
      markdown += `### Phase ${index + 1}: ${phase.title}\n\n`;
      markdown += `${phase.description}\n\n`;
      markdown += `**Estimated Time:** ${phase.estimatedTime}\n\n`;

      if (phase.resources.length > 0) {
        markdown += `**Recommended Resources:**\n\n`;
        phase.resources.forEach(resource => {
          markdown += `- [${resource.resource.title}](${resource.resource.url}) (${resource.category}) - ${resource.reason}\n`;
        });
        markdown += '\n';
      }
    });

    return markdown;
  };

  const reset = () => {
    setMode('ideas');
    setQuery('');
    setProjectIdeas([]);
    setSelectedIdea(null);
    setResourceRecommendations([]);
    setProjectPlan(null);
    setSelectedResources(new Set());
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Project Builder</h1>
                <p className="text-purple-100 text-sm">
                  {mode === 'ideas' && 'Generate project ideas based on your interests'}
                  {mode === 'resources' && 'Select resources for your project'}
                  {mode === 'plan' && 'Review your personalized project plan'}
                  {mode === 'path' && 'Create a learning path'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center space-x-2 mt-4">
            {[
              { id: 'ideas', label: 'Ideas', icon: Lightbulb },
              { id: 'resources', label: 'Resources', icon: Database },
              { id: 'plan', label: 'Plan', icon: Target },
              { id: 'path', label: 'Learning Path', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(tab.id as Mode)}
                  disabled={!selectedIdea && tab.id !== 'ideas'}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    mode === tab.id
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Ideas Mode */}
          {mode === 'ideas' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Input Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to build?
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && generateProjectIdeas()}
                      placeholder="e.g., 'weather app with AI predictions', 'data visualization dashboard', 'machine learning classifier'"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={generateProjectIdeas}
                      disabled={loading || !query.trim()}
                      className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>

                  {/* Skill Level Selector */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your skill level
                    </label>
                    <div className="flex space-x-2">
                      {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((level) => (
                        <motion.button
                          key={level}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSkillLevel(level)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            skillLevel === level
                              ? 'bg-purple-100 text-purple-700 border-purple-200 border'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                {/* Project Ideas */}
                {projectIdeas.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectIdeas.map((idea, index) => (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => selectProjectIdea(idea)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">
                            {idea.title}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(idea.difficulty)}`}>
                            {idea.difficulty}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">
                          {idea.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {idea.estimatedTime}
                          </div>
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {idea.learningObjectives.length} objectives
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {idea.tags.slice(0, 4).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {idea.tags.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{idea.tags.length - 4} more
                            </span>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Choose This Idea
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources Mode */}
          {mode === 'resources' && selectedIdea && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                {/* Selected Idea Summary */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-purple-900 mb-1">
                        {selectedIdea.title}
                      </h2>
                      <p className="text-purple-700 text-sm">
                        {selectedIdea.description}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedIdea.difficulty)}`}>
                      {selectedIdea.difficulty}
                    </div>
                  </div>
                </div>

                {/* Resource Selection Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-blue-700 text-sm">
                      Select resources that will help you build this project. We'll create a structured plan based on your selections.
                    </p>
                  </div>
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {resourceRecommendations.map((recommendation, index) => {
                    const Icon = getResourceIcon(recommendation.category);
                    const isSelected = selectedResources.has(recommendation.resource.id);

                    return (
                      <motion.div
                        key={recommendation.resource.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 shadow-lg bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow'
                        }`}
                        onClick={() => toggleResourceSelection(recommendation.resource.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              isSelected ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {recommendation.category}
                            </span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {recommendation.resource.title}
                        </h4>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {recommendation.resource.description || 'No description available'}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Relevance: <span className="font-semibold">{Math.round(recommendation.relevanceScore * 100)}%</span>
                          </div>
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {recommendation.reason}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Selected {selectedResources.size} of {resourceRecommendations.length} resources
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode('ideas')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Ideas
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={generateProjectPlan}
                      disabled={selectedResources.size === 0 || loading}
                      className="flex items-center px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Target className="h-5 w-5 mr-2" />
                      )}
                      Generate Project Plan
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plan Mode */}
          {mode === 'plan' && projectPlan && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Project Plan Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-2">{projectPlan.idea.title}</h2>
                  <p className="text-purple-100 mb-4">{projectPlan.idea.description}</p>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{projectPlan.phases.length}</div>
                      <div className="text-purple-100 text-sm">Phases</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{projectPlan.estimatedDuration}</div>
                      <div className="text-purple-100 text-sm">Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{projectPlan.skills.length}</div>
                      <div className="text-purple-100 text-sm">Skills to Learn</div>
                    </div>
                  </div>
                </div>

                {/* Project Phases */}
                <div className="space-y-6 mb-6">
                  {projectPlan.phases.map((phase, index) => (
                    <div key={phase.id} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3 font-semibold">
                            {index + 1}
                          </div>
                          {phase.title}
                        </h3>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {phase.estimatedTime}
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{phase.description}</p>

                      {phase.resources.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Recommended Resources</h4>
                          <div className="space-y-2">
                            {phase.resources.map((resource, resourceIndex) => {
                              const Icon = getResourceIcon(resource.category);
                              return (
                                <div key={resourceIndex} className="flex items-center bg-gray-50 rounded-lg p-3">
                                  <div className="p-2 bg-white rounded-lg mr-3">
                                    <Icon className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-sm">
                                      {resource.resource.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {resource.category} • {resource.reason}
                                    </div>
                                  </div>
                                  <a
                                    href={resource.resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                  >
                                    View Resource
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Skills Learned */}
                {projectPlan.skills.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold text-green-900 mb-3">Skills You'll Learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {projectPlan.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={reset}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Start New Project
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={exportProjectPlan}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Plan
                    </motion.button>
                  </div>

                  {onProjectCreated && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onProjectCreated(projectPlan)}
                      className="flex items-center px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Start Project
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}