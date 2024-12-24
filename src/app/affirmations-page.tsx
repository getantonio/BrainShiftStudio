"use client";

import React, { useState, useRef } from 'react';
import { getMatchingAffirmations } from '@/utils/affirmationUtils';
import { affirmationCategories } from '@/data/affirmations';
import AudioWaveform from '@/components/AudioWaveform';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAffirmations, setCurrentAffirmations] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Recording functions
  const startRecording = async () => {
    try {
      console.log('Requesting microphone permissions...');
      const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Permission result:', permissionResult.state);

      if (permissionResult.state === 'denied') {
        alert('Please enable microphone access in your browser settings to use this feature.');
        return;
      }

      console.log('Requesting audio stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      console.log('Audio stream obtained:', stream);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      console.log('MediaRecorder created:', mediaRecorderRef.current);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log('Recording stopped, audio URL created:', url);
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      console.log('Recording started.');
    } catch (err) {
      console.error('Error accessing microphone:', err);
    
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow access in browser settings.');
        } else if (err.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`An error occurred: ${err.message}`);
        }
      } else {
        alert('An unknown error occurred.');
      }
    }
    
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('Recording stopped.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const generateAffirmations = () => {
    const newAffirmations = selectedCategory
      ? affirmationCategories
          .find(cat => cat.id === selectedCategory)
          ?.affirmations
          .map(a => a.text)
          .sort(() => Math.random() - 0.5)
          .slice(0, 5) || []
      : getMatchingAffirmations(affirmation);
    setCurrentAffirmations(newAffirmations);
  };

  const refreshAffirmations = () => {
    if (affirmation || selectedCategory) {
      generateAffirmations();
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
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Select a Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {affirmationCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="block text-gray-700 text-sm font-bold mb-2">
              What negative self-talk would you like to transform?
            </label>
            <textarea
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
              placeholder="Enter your thoughts here..."
            />
            
            <div className="space-y-4 mt-4">
              <button
                onClick={generateAffirmations}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Generate Affirmations
              </button>

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
            </div>

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
    <AudioWaveform 
      audioUrl={audioUrl}
      onTrimComplete={(trimmedUrl) => {
        // Update the audio URL to the trimmed version
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl); // Clean up old URL
        }
        setAudioUrl(trimmedUrl);
      }}
    />
    <audio controls className="w-full mt-2">
      <source src={audioUrl} type="audio/webm;codecs=opus" />
      Your browser does not support the audio element.
    </audio>
  </div>
)}
          </div>

          {/* Affirmations Preview Card */}
          {currentAffirmations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  Your Positive Affirmations:
                </h2>
                <button
                  onClick={refreshAffirmations}
                  className="text-blue-500 hover:text-blue-600"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="space-y-4">
                {currentAffirmations.map((aff, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700">{aff}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}