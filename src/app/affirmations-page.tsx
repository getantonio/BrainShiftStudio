"use client";

import React, { useState, useRef } from 'react';
import { getMatchingAffirmations } from '@/utils/affirmationUtils';
import { affirmationCategories } from '@/data/affirmations';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import RecordRTC from 'recordrtc';
import { URL as NodeURL } from 'url';

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAffirmations, setCurrentAffirmations] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  let recorder = null;

  const startRecording = async () => {
    try {
      console.log('Requesting microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Audio stream obtained:', stream);

      recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        sampleRate: 44100,
      });

      recorder.startRecording();
      setIsRecording(true);
      console.log('Recording started.');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access the microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (recorder && isRecording) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        let url;
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          // Browser environment
          url = URL.createObjectURL(blob);
        } else if (NodeURL) {
          // Node.js fallback
          console.error('URL.createObjectURL is not supported in this environment.');
          return;
        }
        setAudioUrl(url);
        console.log('Recording stopped, audio URL created:', url);
      });

      setIsRecording(false);
      recorder = null;
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
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/wav" />
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
