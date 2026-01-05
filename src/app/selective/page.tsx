'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Section data type
interface SectionProgress {
  totalAttempts: number;
  accuracyRate: number;
}

interface ProgressData {
  reading: SectionProgress;
  mathematics: SectionProgress;
  thinkingSkills: SectionProgress;
  writing: SectionProgress;
}

export default function SelectiveHub() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Load actual progress from Firebase
    const loadProgress = async () => {
      try {
        // Simulated delay for now
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgressData(null); // No progress yet
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 0.8) return 'text-green-600 bg-green-100';
    if (accuracy >= 0.6) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">NSW Selective Exam Prep</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white">NSW Selective High School</h2>
          <p className="text-purple-100 mt-1">Year 7 Entry Examination</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <InfoChip icon="book" label="4 Sections" />
            <InfoChip icon="quiz" label="210 Questions" />
            <InfoChip icon="timer" label="140 Minutes" />
          </div>
        </div>

        {/* Progress Summary */}
        {!progressData ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start your preparation?</h3>
            <p className="text-gray-500">Choose a practice mode below to begin</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Progress</h3>
            <div className="space-y-3">
              <ProgressRow title="Reading" section={progressData.reading} getColor={getAccuracyColor} />
              <ProgressRow title="Mathematics" section={progressData.mathematics} getColor={getAccuracyColor} />
              <ProgressRow title="Thinking Skills" section={progressData.thinkingSkills} getColor={getAccuracyColor} />
              <ProgressRow title="Writing" section={progressData.writing} getColor={getAccuracyColor} />
            </div>
          </div>
        )}

        {/* Analytics Card */}
        <Link href="/selective/analytics" className="block mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">View Detailed Analytics</h3>
                <p className="text-purple-100 text-sm">Readiness score, trends, and personalized recommendations</p>
              </div>
              <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Practice Modes */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Modes</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <PracticeModeCard
            href="/selective/reading"
            title="Reading"
            subtitle="60 questions"
            icon="book"
            color="blue"
          />
          <PracticeModeCard
            href="/selective/mathematics"
            title="Mathematics"
            subtitle="70 questions"
            icon="calculator"
            color="purple"
          />
          <PracticeModeCard
            href="/selective/thinking-skills"
            title="Thinking Skills"
            subtitle="80 questions"
            icon="brain"
            color="teal"
          />
          <PracticeModeCard
            href="/selective/writing"
            title="Writing"
            subtitle="2 prompts"
            icon="pencil"
            color="orange"
          />
        </div>

        {/* Mock Exams */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">Mock Exams</h3>
        <Link href="/selective/mock-exam" className="block">
          <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Full Mock Examination</h3>
                <p className="text-gray-500 text-sm">Complete exam simulation • 140 minutes</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}

// Helper Components
function InfoChip({ icon, label }: { icon: string; label: string }) {
  const iconPath = {
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    quiz: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    timer: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  }[icon] || "";

  return (
    <div className="bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
      <span className="text-white text-xs font-semibold">{label}</span>
    </div>
  );
}

function ProgressRow({
  title,
  section,
  getColor
}: {
  title: string;
  section: SectionProgress;
  getColor: (accuracy: number) => string;
}) {
  return (
    <div className="flex items-center">
      <span className="flex-1 font-medium text-gray-900">{title}</span>
      <span className="text-sm text-gray-500 mr-4">{section.totalAttempts} questions</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getColor(section.accuracyRate)}`}>
        {Math.round(section.accuracyRate * 100)}%
      </span>
    </div>
  );
}

function PracticeModeCard({
  href,
  title,
  subtitle,
  icon,
  color,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'purple' | 'teal' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600',
    orange: 'bg-orange-100 text-orange-600',
  }[color];

  const iconPaths = {
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    brain: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    pencil: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  }[icon] || "";

  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow h-full">
        <div className={`w-12 h-12 ${colorClasses.split(' ')[0]} rounded-xl flex items-center justify-center mb-3`}>
          <svg className={`w-6 h-6 ${colorClasses.split(' ')[1]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths} />
          </svg>
        </div>
        <h4 className="font-bold text-gray-900">{title}</h4>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
    </Link>
  );
}
