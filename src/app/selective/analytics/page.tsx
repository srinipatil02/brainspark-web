'use client';

import Link from 'next/link';

export default function Analytics() {
  // Sample analytics data - will be loaded from Firebase
  const readinessScore = 72;
  const sectionScores = [
    { name: 'Reading', score: 78, questions: 45, color: 'blue' },
    { name: 'Mathematics', score: 65, questions: 52, color: 'purple' },
    { name: 'Thinking Skills', score: 70, questions: 38, color: 'teal' },
    { name: 'Writing', score: 75, questions: 4, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/selective" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">NSW Selective Performance</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Readiness Score */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl p-8 mb-8 text-white">
          <p className="text-purple-100 text-sm mb-1">Overall Readiness Score</p>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-bold">{readinessScore}</span>
            <span className="text-2xl text-purple-200 mb-2">/100</span>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all" style={{ width: `${readinessScore}%` }} />
          </div>
          <p className="text-purple-100 text-sm mt-3">
            {readinessScore >= 80 ? 'Excellent! You are well prepared.' :
             readinessScore >= 60 ? 'Good progress! Keep practicing.' :
             'More practice needed. Focus on weak areas.'}
          </p>
        </div>

        {/* Section Breakdown */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Section Performance</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {sectionScores.map((section) => (
            <div key={section.name} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-500">{section.questions} questions attempted</p>
                </div>
                <span className={`text-2xl font-bold ${
                  section.score >= 80 ? 'text-green-600' :
                  section.score >= 60 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {section.score}%
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    section.color === 'blue' ? 'bg-blue-500' :
                    section.color === 'purple' ? 'bg-purple-500' :
                    section.color === 'teal' ? 'bg-teal-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${section.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Focus on Mathematics</h4>
                <p className="text-sm text-gray-500">Your lowest score. Practice algebra and geometry problems.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Complete More Thinking Skills</h4>
                <p className="text-sm text-gray-500">Try pattern recognition and spatial reasoning exercises.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Take a Full Mock Exam</h4>
                <p className="text-sm text-gray-500">Practice under timed conditions to build exam stamina.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link href="/selective/mathematics" className="flex-1">
            <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
              Practice Mathematics
            </button>
          </Link>
          <Link href="/selective/mock-exam" className="flex-1">
            <button className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors">
              Start Mock Exam
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
