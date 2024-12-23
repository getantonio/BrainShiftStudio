"use client";

import React, { useState } from 'react';

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-900">
          BrainShift Studio
        </h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
            <label className="block text-lg font-medium mb-4 text-gray-700">
              What negative self-talk would you like to transform?
            </label>
            <textarea
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Example: I always procrastinate and never finish what I start..."
            />
            
            <div className="mt-6">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg shadow-md transition-colors duration-200 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isRecording ? '⚫ Stop Recording' : '🎤 Start Recording'}
              </button>
            </div>
          </div>
          
          {affirmation && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Your Positive Affirmation Preview:
              </h2>
              <div className="p-4 bg-blue-50 rounded-lg text-gray-700">
                <p className="mb-2">
                  I am capable of focusing and completing tasks efficiently.
                </p>
                <p>
                  Each step I take brings me closer to my goals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}