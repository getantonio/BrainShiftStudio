"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface AudioWaveformProps {
  audioUrl: string;
  onTrimComplete?: (trimmedAudioUrl: string) => void;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioUrl, onTrimComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!audioUrl) return;

    const loadAudioData = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
        drawWaveform(buffer);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    loadAudioData();
  }, [audioUrl]);

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
    }
    ctx.stroke();

    // Draw waveform
    ctx.fillStyle = 'rgb(59, 130, 246)'; // Blue color
    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      ctx.fillRect(
        i,
        (1 + min) * amp,
        2, // Slightly thicker bars
        Math.max(2, (max - min) * amp)
      );
    }

    drawTrimHandles();
  };

  const drawTrimHandles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleWidth = 20; // Increased handle width
    const handleHeight = canvas.height;

    // Draw semi-transparent overlay for trimmed parts
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, (canvas.width * trimStart) / 100, canvas.height);
    ctx.fillRect((canvas.width * trimEnd) / 100, 0, canvas.width, canvas.height);

    // Draw trim handles with a more visible design
    const drawHandle = (x: number) => {
      // Draw handle bar with wider width
      ctx.fillStyle = 'rgb(59, 130, 246)';
      ctx.fillRect(x - handleWidth/2, 0, handleWidth, handleHeight);
      
      // Draw grip lines
      ctx.fillStyle = 'white';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(
          x - 1 + (i * 5) - handleWidth/2 + 5, // Increased spacing
          handleHeight/2 - 20,  // Longer lines
          3,  // Thicker lines
          40  // Longer lines
        );
      }
    };

    drawHandle((canvas.width * trimStart) / 100);
    drawHandle((canvas.width * trimEnd) / 100);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startX = (canvas.width * trimStart) / 100;
    const endX = (canvas.width * trimEnd) / 100;

    if (Math.abs(x - startX) < 25) { // Increased hit area
      setIsDragging('start');
    } else if (Math.abs(x - endX) < 25) { // Increased hit area
      setIsDragging('end');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !audioBuffer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / canvas.width) * 100));

    if (isDragging === 'start' && percentage < trimEnd - 5) {
      setTrimStart(percentage);
      setShowConfirm(true);
    } else if (isDragging === 'end' && percentage > trimStart + 5) {
      setTrimEnd(percentage);
      setShowConfirm(true);
    }

    drawWaveform(audioBuffer);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const trimAudio = async () => {
    if (!audioBuffer) return;

    try {
      // Create new AudioContext
      const ctx = new AudioContext();
      
      // Calculate trim points in seconds
      const duration = audioBuffer.duration;
      const startTime = (trimStart / 100) * duration;
      const endTime = (trimEnd / 100) * duration;
      const trimmedLength = Math.floor((endTime - startTime) * audioBuffer.sampleRate);

      // Create new buffer for trimmed audio
      const trimmedAudioBuffer = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
      );

      // Copy the trimmed portion
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedAudioBuffer.getChannelData(channel);
        const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
        for (let i = 0; i < trimmedLength; i++) {
          trimmedData[i] = channelData[startOffset + i];
        }
      }

      // Convert trimmed buffer to blob
      const offlineCtx = new OfflineAudioContext(
        trimmedAudioBuffer.numberOfChannels,
        trimmedLength,
        trimmedAudioBuffer.sampleRate
      );
      
      const source = offlineCtx.createBufferSource();
      source.buffer = trimmedAudioBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      const renderedBuffer = await offlineCtx.startRendering();
      const trimmedBlob = await audioBufferToWav(renderedBuffer);
      const trimmedUrl = URL.createObjectURL(trimmedBlob);

      onTrimComplete?.(trimmedUrl);
      setShowConfirm(false);
    } catch (error) {
      console.error('Error trimming audio:', error);
    }
  };

  const handleConfirmTrim = () => {
    trimAudio();
  };

  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const view = new DataView(new ArrayBuffer(44 + length));

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const offset = 44;
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => 
      buffer.getChannelData(i)
    );

    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset + (i * buffer.numberOfChannels + channel) * 2, 
          sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full h-32 bg-blue-50 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={128}
          className="w-full h-full cursor-col-resize"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Trim indicators */}
        <div className="absolute bottom-2 left-2 text-xs font-mono bg-black/50 text-white px-2 py-1 rounded">
          {trimStart.toFixed(1)}%
        </div>
        <div className="absolute bottom-2 right-2 text-xs font-mono bg-black/50 text-white px-2 py-1 rounded">
          {trimEnd.toFixed(1)}%
        </div>
      </div>

      {showConfirm && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTrimStart(0);
              setTrimEnd(100);
              setShowConfirm(false);
              if (audioBuffer) drawWaveform(audioBuffer);
            }}
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmTrim}
          >
            Confirm Trim
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;