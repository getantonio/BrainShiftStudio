'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from "lucide-react";

interface ModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ModeToggle({ isDark, onToggle }: ModeToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={onToggle}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full
        transition-colors duration-300 ease-in-out focus:outline-none
        ${isDark 
          ? 'bg-gray-700 hover:bg-gray-600' 
          : 'bg-blue-100 hover:bg-blue-200'
        }
      `}
    >
      <div
        className={`
          absolute flex h-6 w-6 items-center justify-center rounded-full
          shadow-lg transition-transform duration-300 ease-in-out
          ${isDark 
            ? 'translate-x-7 bg-gray-900' 
            : 'translate-x-1 bg-white'
          }
        `}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-white" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    </button>
  );
} 