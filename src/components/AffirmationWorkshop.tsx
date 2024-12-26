'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { CheckCircle, AlertCircle, Lightbulb, ChevronDown, ChevronRight } from "lucide-react";

interface Suggestion {
  original: string;
  suggestion: string;
  reason: string;
}

interface Guidelines {
  check: string;
  examples: string[];
  suggestion: (text: string) => boolean;
}

const AFFIRMATION_GUIDELINES: Guidelines[] = [
  {
    check: "Uses present tense",
    examples: ["I am", "I feel", "I create", "I have"],
    suggestion: (text: string) => 
      /\b(I am|I'm|I feel|I create|I have|I)\b/i.test(text)
  },
  {
    check: "Keeps it positive",
    examples: ["confident", "strong", "capable", "successful"],
    suggestion: (text: string) => 
      !/(not|never|can't|cannot|won't|don't|no|none)/i.test(text)
  },
  {
    check: "Includes emotion or power word",
    examples: ["confidently", "powerfully", "joyfully", "passionately"],
    suggestion: (text: string) => 
      /(ly|joy|love|peace|strength|power|happy|confident)/i.test(text)
  },
  {
    check: "Mentions desired outcome",
    examples: ["success", "health", "wealth", "happiness"],
    suggestion: (text: string) => 
      /(success|health|wealth|happiness|abundance|growth|peace|love)/i.test(text)
  }
];

const POWER_WORDS = [
  "confidently", "powerfully", "effortlessly", "naturally",
  "easily", "joyfully", "abundantly", "perfectly",
  "successfully", "gracefully", "magnificently", "brilliantly"
];

const STARTER_TEMPLATES = [
  "I am confidently creating...",
  "I naturally attract...",
  "I effortlessly achieve...",
  "I am grateful for...",
  "I deserve and accept...",
];

export function AffirmationWorkshop() {
  const [affirmation, setAffirmation] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [guidelineChecks, setGuidelineChecks] = useState<boolean[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    analyzeAffirmation(affirmation);
  }, [affirmation]);

  const analyzeAffirmation = (text: string) => {
    const newChecks = AFFIRMATION_GUIDELINES.map(guide => guide.suggestion(text));
    setGuidelineChecks(newChecks);

    const newSuggestions: Suggestion[] = [];
    
    // Check length
    if (text.length > 100) {
      newSuggestions.push({
        original: text,
        suggestion: text.substring(0, 100) + "...",
        reason: "Keep affirmations concise (under 100 characters)"
      });
    }

    // Suggest power words if none present
    if (!text.match(/ly\b/)) {
      const randomPowerWord = POWER_WORDS[Math.floor(Math.random() * POWER_WORDS.length)];
      newSuggestions.push({
        original: text,
        suggestion: text.replace(/\.$/, "") + ` ${randomPowerWord}.`,
        reason: "Add a power word to strengthen your affirmation"
      });
    }

    setSuggestions(newSuggestions);
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-2xl">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Create Your Own Affirmation</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Craft a powerful affirmation using the guidelines below
        </p>
      </div>

      <button
        onClick={() => setShowGuidelines(!showGuidelines)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
      >
        <span className="font-medium">Affirmation Guidelines</span>
        {showGuidelines ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {showGuidelines && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AFFIRMATION_GUIDELINES.map((guide, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  guidelineChecks[index] 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {guidelineChecks[index] ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium">{guide.check}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Examples: {guide.examples.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={affirmation}
            onChange={(e) => setAffirmation(e.target.value)}
            placeholder="Type your affirmation here..."
            className="w-full h-32 p-4 text-lg border rounded-xl dark:bg-gray-700 dark:border-gray-600"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="absolute top-2 right-2"
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            Templates
          </Button>
        </div>

        {showTemplates && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {STARTER_TEMPLATES.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => setAffirmation(template)}
                className="justify-start"
              >
                {template}
              </Button>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Suggestions:</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-blue-800 dark:text-blue-200">{suggestion.reason}</p>
                      <p className="text-sm">{suggestion.suggestion}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setAffirmation(suggestion.suggestion)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 