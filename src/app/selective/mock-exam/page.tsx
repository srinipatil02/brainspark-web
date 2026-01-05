'use client';

import Link from 'next/link';

export default function MockExam() {
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
            <h1 className="text-xl font-semibold text-gray-900">Mock Examination</h1>
            <p className="text-sm text-gray-500">NSW Selective Practice</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-center text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Full Mock Examination</h2>
          <p className="text-amber-100">Simulate the real NSW Selective High School Entry Test</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-900 mb-4">Exam Structure</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Reading</span>
                <span className="font-medium">30 mins • 30 questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mathematics</span>
                <span className="font-medium">40 mins • 35 questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thinking Skills</span>
                <span className="font-medium">40 mins • 40 questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Writing</span>
                <span className="font-medium">30 mins • 1 task</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>140 minutes</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-900 mb-4">Before You Start</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Find a quiet place with no distractions
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Have scratch paper and pencil ready
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Turn off notifications on your device
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You cannot pause once started
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <button className="px-8 py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition-colors shadow-lg">
            Start Mock Exam
          </button>
          <p className="text-gray-500 text-sm mt-3">This will take approximately 2 hours and 20 minutes</p>
        </div>
      </main>
    </div>
  );
}
