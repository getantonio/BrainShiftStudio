"use client";

import React, { useState, useRef } from 'react';

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // First check if we have permission
      const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionResult.state === 'denied') {
        alert('Please enable microphone access in your browser settings to use this feature.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access microphone. Please make sure your microphone is connected and you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              BrainShift Studio
            </h1>
            <p className="text-center text-gray-600">Transform your self-talk into positive affirmations</p>
          </div>

          {/* Input Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              What negative self-talk would you like to transform?
            </label>
            <textarea
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
              placeholder="Example: I always procrastinate..."
            />
            
            <button
              onClick={toggleRecording}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
            </button>

            {isRecording && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-red-600 text-sm text-center animate-pulse">
                  Recording in progress...
                </p>
              </div>
            )}

            {audioUrl && !isRecording && (
             <div className="mt-4">
              <h3 className="text-sm font-bold mb-2">Recording Preview:</h3>
             <audio controls className="w-full">
              <source src={audioUrl} type="audio/webm" />
             Your browser does not support the audio element.
            </audio>
            </div>
            )}
          </div>

          {/* Preview Card */}
          {affirmation && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Your Positive Affirmation:
              </h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  I am capable of focusing and completing tasks efficiently.
                </p>
                <p className="text-gray-700">
                  Each step I take brings me closer to my goals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}