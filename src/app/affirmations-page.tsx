"use client";

import React, { useState } from 'react';

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            BrainShift Studio
          </h1>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              What negative self-talk would you like to transform?
            </label>
            <textarea
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
              rows={4}
              placeholder="Example: I always procrastinate..."
            />
          </div>
          
          <button
            onClick={() => setIsRecording(!isRecording)}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
          </button>
        </div>
      </div>
    </div>
  );
}