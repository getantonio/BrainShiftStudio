"use client";

import React, { useState } from 'react';

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">
          BrainShift Studio
        </h1>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium mb-2">
              What negative self-talk would you like to transform?
            </label>
            <textarea
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Example: I always procrastinate and never finish what I start..."
            />
            
            <div className="mt-4">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-4 py-2 rounded-md ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
            </div>
          </div>
          
          {affirmation && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-medium mb-2">Positive Affirmation Preview:</h2>
              <p className="text-gray-700">
                I am capable of focusing and completing tasks efficiently. 
                Each step I take brings me closer to my goals.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}