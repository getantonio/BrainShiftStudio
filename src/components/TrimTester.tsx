'use client';

import React, { useRef, useState } from 'react';

export function TrimTester() {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<'start' | 'end' | null>(null);

  const handleMouseDown = (e: React.MouseEvent, handle: 'start' | 'end') => {
    isDraggingRef.current = handle;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

    if (isDraggingRef.current === 'start') {
      setTrimStart(Math.min(position, trimEnd - 1));
    } else {
      setTrimEnd(Math.max(position, trimStart + 1));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = null;
  };

  return (
    <div className="p-8">
      <div 
        ref={containerRef}
        className="relative h-40 bg-gray-100 rounded-lg"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Trimmed area visualization */}
        <div 
          className="absolute inset-y-0 bg-blue-200"
          style={{
            left: `${trimStart}%`,
            right: `${100 - trimEnd}%`
          }}
        />

        {/* Start handle */}
        <div
          className="absolute inset-y-0 w-4 bg-blue-500 cursor-ew-resize flex items-center justify-center"
          style={{ left: `${trimStart}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="w-1 h-8 bg-white rounded" />
        </div>

        {/* End handle */}
        <div
          className="absolute inset-y-0 w-4 bg-blue-500 cursor-ew-resize flex items-center justify-center"
          style={{ left: `${trimEnd}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="w-1 h-8 bg-white rounded" />
        </div>

        {/* Debug info */}
        <div className="absolute bottom-2 left-2 text-sm">
          Start: {trimStart.toFixed(1)}%
          <br />
          End: {trimEnd.toFixed(1)}%
        </div>
      </div>
    </div>
  );
} 