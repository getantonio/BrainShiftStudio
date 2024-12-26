'use client';

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "./button";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="w-10 h-10 rounded-full"
    >
      {isDark ? (
        <MoonIcon className="h-[1.2rem] w-[1.2rem] rotate-90 transition-all dark:rotate-0" />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 