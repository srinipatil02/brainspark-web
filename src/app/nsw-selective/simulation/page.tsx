// =============================================================================
// NSW SELECTIVE EXAM SIMULATION PAGE
// =============================================================================
// FILE: src/app/nsw-selective/simulation/page.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Full exam simulation (35 questions, 40 minutes) matching real exam conditions
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import Link from 'next/link';
import { useAllArchetypeProgress } from '@/hooks/nsw-selective/useArchetypeProgress';
import SimulationClient from '@/components/nsw-selective/SimulationClient';

export default function SimulationPage() {
  const { examReadiness } = useAllArchetypeProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/nsw-selective" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Exam Simulation</h1>
              <p className="text-sm text-gray-500">Full mock exam under real conditions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Readiness Check */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-800 mb-1">Your Current Readiness</h3>
              <p className="text-sm text-gray-600">
                Based on your practice sessions across all archetypes
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-700">{examReadiness}%</p>
              <p className="text-xs text-gray-500">Ready</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                examReadiness >= 70 ? 'bg-green-500' :
                examReadiness >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${examReadiness}%` }}
            />
          </div>
          {examReadiness < 50 && (
            <p className="mt-2 text-sm text-amber-700">
              Consider more practice before taking a full simulation.
            </p>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Real Exam Conditions</h2>
              <p className="text-gray-600 mb-4">
                This simulation matches the actual NSW Selective Mathematics exam format.
                Once started, you cannot pause or go back to previous questions.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-600">35</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-600">40</p>
                  <p className="text-xs text-gray-500">Minutes</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-600">5</p>
                  <p className="text-xs text-gray-500">Options (A-E)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Simulation Rules</h3>
          <ul className="space-y-3">
            {[
              { icon: '⏱️', text: 'Timer starts immediately and cannot be paused' },
              { icon: '➡️', text: 'You cannot go back to previous questions' },
              { icon: '📵', text: 'No calculator allowed (matches real exam)' },
              { icon: '⚠️', text: 'Warnings at 10 min, 5 min, and 1 min remaining' },
              { icon: '📊', text: 'Detailed analysis provided after completion' },
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xl">{rule.icon}</span>
                <span className="text-gray-700">{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Simulation Client (handles all exam phases) */}
        <SimulationClient />

        {/* Tips */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips for Exam Day</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-500">✓</span> Time Management
              </h4>
              <p className="text-sm text-gray-500">
                Average ~1 minute per question. Don't spend more than 2 minutes on any single question.
              </p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-500">✓</span> Read Carefully
              </h4>
              <p className="text-sm text-gray-500">
                Many errors come from misreading the question. Identify WHAT is being asked first.
              </p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-500">✓</span> Eliminate Options
              </h4>
              <p className="text-sm text-gray-500">
                Even if unsure, eliminating wrong answers improves your odds significantly.
              </p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-500">✓</span> Don't Leave Blanks
              </h4>
              <p className="text-sm text-gray-500">
                No negative marking—always answer every question, even if guessing.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
