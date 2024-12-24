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
  SelectValue,
} from "@/components/ui/select";

// Simplified: removed unused parameter
async function getAISuggestions(): Promise<string[]> {
  // If you have an actual API call, place it here:
  return [
    '“I am worthy of success in all aspects of my life.”',
    '“I confidently step into my future with positivity.”',
  ];
}

// Simplified: removed unused parameters
function generateVoiceFromSample(): Promise<Blob> {
  // Placeholder that returns a dummy WAV blob
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Blob([], { type: 'audio/wav' }));
    }, 2000);
  });
}

export default function AffirmationsPage() {
  const [affirmation, setAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAffirmations, setCurrentAffirmations] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // NEW: user-written affirmation state
  const [userAffirmation, setUserAffirmation] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check for a supported MIME type
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=opus',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  // Recording functions
  const startRecording = async () => {
    try {
      const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permissionResult.state === 'denied') {
        alert('Please enable microphone access in your browser settings to use this feature.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      const mimeType = getSupportedMimeType();
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000,
      });
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm;codecs=opus',
        });
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };
      mediaRecorderRef.current.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow access in browser settings.');
        } else if (err.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else if (err.name === 'NotSupportedError') {
          alert('Audio recording is not supported in this browser.');
        } else {
          alert(`An error occurred: ${err.message}`);
        }
      } else {
        alert('An unknown error occurred while trying to access the microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
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

  const generateAffirmations = () => {
    const newAffirmations = selectedCategory
      ? affirmationCategories
          .find((cat) => cat.id === selectedCategory)
          ?.affirmations.map((a) => a.text)
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

  // New: get AI suggestions for user’s custom affirmation
  const handleGetAISuggestions = async () => {
    if (!userAffirmation.trim()) return;
    const suggestions = await getAISuggestions();
    setAiSuggestions(suggestions);
  };

  // Example formula instructions
  const AFFIRMATION_FORMULA = [
    "Use present tense (e.g., 'I am', 'I feel', 'I create').",
    "Keep it positive and short.",
    "Incorporate emotion or a powerful word (e.g., 'confidently').",
    "Mention your desired outcome or trait (e.g., 'success', 'health').",
    "Optional: Add a 'because' statement to highlight your reasoning or motivation."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              BrainShift Studio
            </h1>
            <p className="text-center text-gray-600">
              Transform your self-talk into positive affirmations
            </p>
          </div>

          {/* Input Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Select a Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
              spellCheck={true} // Enable basic browser-based spell checking
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
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
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

          {/* 3. Let user write their own affirmations + AI suggestions */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Create Your Own Affirmation
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Use the following guidelines to craft a powerful affirmation:
            </p>
            <ul className="list-disc list-inside mb-4 text-sm text-gray-600">
              {AFFIRMATION_FORMULA.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
            <textarea
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 mb-2"
              placeholder="Write your personal affirmation here..."
              value={userAffirmation}
              onChange={(e) => setUserAffirmation(e.target.value)}
              spellCheck={true}
            />

            <div className="flex space-x-2">
              <button
                onClick={handleGetAISuggestions}
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
              >
                Get AI Suggestions
              </button>
              <button
                onClick={() => {
                  // If you want to do something with userAffirmation
                  alert(`Affirmation Saved!\n\n${userAffirmation}`);
                }}
                className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
              >
                Save Affirmation
              </button>
            </div>

            {/* Show AI suggestions if any */}
            {aiSuggestions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2 text-gray-800">
                  AI Suggestions:
                </h3>
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <li key={idx} className="bg-blue-50 p-2 rounded text-gray-700 text-sm">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 5. Voice Generator (lowest priority) — placeholder */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Voice Generator (Demo)</h2>
            <p className="text-sm text-gray-500 mb-4">
              This feature would clone your voice from a sample and generate
              an affirmation audio. (Placeholder only)
            </p>
            <button
              onClick={() => {
                if (!audioUrl) {
                  alert('Record some audio first!');
                  return;
                }
                // Example usage
                fetch(audioUrl)
                  .then((res) => res.blob())
                  .then(() => generateVoiceFromSample()) // <-- removed unused "blob"
                  .then((generatedBlob) => {
                    const genUrl = URL.createObjectURL(generatedBlob);
                    const audio = new Audio(genUrl);
                    audio.play();
                    alert('Playing your AI-generated voice sample...');
                  });
              }}
              className="bg-purple-500 text-white font-bold py-2 px-4 rounded hover:bg-purple-600"
            >
              Generate Voice from Sample
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
