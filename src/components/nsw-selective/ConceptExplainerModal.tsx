// =============================================================================
// CONCEPT EXPLAINER MODAL COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/ConceptExplainerModal.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Multi-modal concept explanations (visual, analogy, procedural)
// GOAL: Find the explanation that "clicks" for each student

'use client';

import { useState, useEffect } from 'react';
import { getAIConceptExplanation, ConceptExplainerResponse, ConceptExplanation } from '@/services/nsw-selective/aiTutoringService';

// =============================================================================
// TYPES
// =============================================================================

interface ConceptExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptName: string;
  conceptDefinition: string;
  methodology: string[];
  examples: string[];
  previousExplanationsSeen?: string[];
  preferredLearningStyle?: 'visual' | 'verbal' | 'example-based';
  relatedConceptsMastered?: string[];
  specificConfusion?: string;
  onExplanationViewed?: (type: 'visual' | 'analogy' | 'procedural') => void;
}

type ExplanationType = 'visual' | 'analogy' | 'procedural';

// =============================================================================
// ICON COMPONENTS
// =============================================================================

function EyeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function LightbulbIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ListIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-gray-600 font-medium">Creating personalized explanations...</p>
      <p className="text-sm text-gray-400 mt-1">Finding the best way to explain this for you</p>
    </div>
  );
}

// =============================================================================
// TAB CONFIG
// =============================================================================

const TABS: { type: ExplanationType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    type: 'visual',
    label: 'Visual',
    icon: <EyeIcon className="w-4 h-4" />,
    color: 'blue',
  },
  {
    type: 'analogy',
    label: 'Real-World',
    icon: <LightbulbIcon className="w-4 h-4" />,
    color: 'amber',
  },
  {
    type: 'procedural',
    label: 'Step-by-Step',
    icon: <ListIcon className="w-4 h-4" />,
    color: 'green',
  },
];

// =============================================================================
// EXPLANATION DISPLAY COMPONENT
// =============================================================================

function ExplanationDisplay({
  explanation,
  type,
}: {
  explanation: ConceptExplanation;
  type: ExplanationType;
}) {
  const colorMap = {
    visual: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', light: 'text-blue-600' },
    analogy: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', light: 'text-amber-600' },
    procedural: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', light: 'text-green-600' },
  };
  const colors = colorMap[type];

  return (
    <div className="space-y-4">
      {/* Main Explanation */}
      <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
        <p className={`${colors.text} leading-relaxed`}>
          {explanation.explanation}
        </p>
      </div>

      {/* Diagram (for visual) */}
      {type === 'visual' && explanation.diagram && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <EyeIcon className="w-4 h-4" />
            Visualization
          </h4>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3">
            {explanation.diagram}
          </pre>
        </div>
      )}

      {/* Analogy (for analogy) */}
      {type === 'analogy' && explanation.analogy && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
            <LightbulbIcon className="w-4 h-4" />
            Think of it like...
          </h4>
          <p className="text-amber-700 italic">
            "{explanation.analogy}"
          </p>
        </div>
      )}

      {/* Steps (for procedural) */}
      {type === 'procedural' && explanation.steps && explanation.steps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <ListIcon className="w-4 h-4" />
            Follow these steps:
          </h4>
          <ol className="space-y-2">
            {explanation.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700 text-sm pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Example */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" />
          Example
        </h4>
        <p className="text-purple-700 text-sm">
          {explanation.example}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ConceptExplainerModal({
  isOpen,
  onClose,
  conceptName,
  conceptDefinition,
  methodology,
  examples,
  previousExplanationsSeen = [],
  preferredLearningStyle,
  relatedConceptsMastered = [],
  specificConfusion,
  onExplanationViewed,
}: ConceptExplainerModalProps) {
  const [activeTab, setActiveTab] = useState<ExplanationType>('visual');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ConceptExplainerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch explanations when modal opens
  useEffect(() => {
    if (isOpen && !response) {
      fetchExplanations();
    }
  }, [isOpen]);

  // Set initial tab based on recommendation
  useEffect(() => {
    if (response?.recommendedFirst) {
      setActiveTab(response.recommendedFirst);
    }
  }, [response?.recommendedFirst]);

  const fetchExplanations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAIConceptExplanation({
        conceptName,
        conceptDefinition,
        methodology,
        examples,
        previousExplanationsSeen,
        preferredLearningStyle,
        relatedConceptsMastered,
        specificConfusion,
      });

      if (result.success) {
        setResponse(result);
      } else {
        setError(result.error || 'Failed to generate explanations');
      }
    } catch (err) {
      console.error('Concept explanation failed:', err);
      setError('Could not connect to AI service');
    }

    setIsLoading(false);
  };

  const handleTabChange = (type: ExplanationType) => {
    setActiveTab(type);
    onExplanationViewed?.(type);
  };

  const getExplanation = (): ConceptExplanation | null => {
    if (!response) return null;
    switch (activeTab) {
      case 'visual':
        return response.visualExplanation || null;
      case 'analogy':
        return response.analogyExplanation || null;
      case 'procedural':
        return response.proceduralExplanation || null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="w-5 h-5 text-purple-200" />
                <span className="text-purple-200 text-sm font-medium">AI Concept Explainer</span>
              </div>
              <h3 className="text-xl font-semibold text-white">
                {conceptName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!isLoading && response && (
          <div className="flex border-b bg-gray-50">
            {TABS.map((tab) => (
              <button
                key={tab.type}
                onClick={() => handleTabChange(tab.type)}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.type
                    ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600 bg-white`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {response.recommendedFirst === tab.type && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                    Best fit
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">{error}</p>
              <button
                onClick={fetchExplanations}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : response ? (
            <>
              {/* Why this approach */}
              {response.whyThisApproach && activeTab === response.recommendedFirst && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <span className="font-medium">Why this approach: </span>
                    {response.whyThisApproach}
                  </p>
                </div>
              )}

              {/* Explanation Content */}
              {getExplanation() ? (
                <ExplanationDisplay
                  explanation={getExplanation()!}
                  type={activeTab}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No {activeTab} explanation available
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Try different tabs if one explanation doesn't click!
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptExplainerModal;
