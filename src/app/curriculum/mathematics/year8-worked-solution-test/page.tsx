'use client';

import Link from 'next/link';

export default function WorkedSolutionTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/curriculum" className="text-blue-600 hover:text-blue-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">WORKED_SOLUTION Test</h1>
              <p className="text-sm text-gray-600">Year 8 Mathematics - Testing student-centered math input</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              🧪
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Testing WORKED_SOLUTION Questions</h2>
              <p className="text-gray-600 mb-4">
                This page tests the new student-centered &quot;Show Your Work&quot; feature. These questions:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li><strong>Accept multiple valid approaches</strong> - solve it your way!</li>
                <li><strong>Free hints</strong> - no penalty, they&apos;re learning tools</li>
                <li><strong>Focus on reasoning</strong> - process matters, not just answers</li>
                <li><strong>Flexible work lines</strong> - add as many steps as you need</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Set Card */}
        <Link
          href="/curriculum/mathematics/year8-worked-solution-test/set/1"
          className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-3xl shadow-lg">
              ✏️
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Worked Solution Test Set
              </h3>
              <p className="text-gray-600">5 questions • Algebra & Geometry</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Linear Equations
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Perimeter
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Area
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  Simplifying
                </span>
              </div>
            </div>
            <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Testing Notes */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-2">🔬 Testing Checklist</h3>
          <ul className="text-amber-700 text-sm space-y-1">
            <li>✓ WorkedSolutionInput renders with starting expression</li>
            <li>✓ Can add multiple work lines (flexible approach)</li>
            <li>✓ Can view hints without penalty</li>
            <li>✓ Final answer input works</li>
            <li>✓ Submit triggers AI grading</li>
            <li>✓ Grading accepts different valid approaches</li>
            <li>✓ Mobile responsive layout</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
