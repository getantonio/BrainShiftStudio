'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';

interface ModernAudioTrimmerProps {
  audioUrl: string;
  onTrimComplete: (trimmedUrl: string) => void;
  onClose?: () => void;
}

const modalVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

const handleVariants: Variants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
};

export function ModernAudioTrimmer({ audioUrl, onTrimComplete, onClose }: ModernAudioTrimmerProps) {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add playback control
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Initialize waveform visualization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !waveformRef.current) return;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    // Create AudioContext and analyze audio data
    const audioContext = new AudioContext();
    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        drawModernWaveform(audioBuffer);
      });
  }, [audioUrl]);

  const drawModernWaveform = (audioBuffer: AudioBuffer) => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw modern waveform with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const height = Math.max(1, (max - min) * amp);
      ctx.fillRect(i, amp - height / 2, 1, height);
    }
  };

  const handleTrim = () => {
    if (!audioRef.current) return;

    const startTime = (trimStart / 100) * duration;
    const endTime = (trimEnd / 100) * duration;

    const audioContext = new AudioContext();
    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const sampleRate = audioBuffer.sampleRate;
        const channels = audioBuffer.numberOfChannels;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const length = endSample - startSample;

        const trimmedBuffer = audioContext.createBuffer(
          channels,
          length,
          sampleRate
        );

        for (let channel = 0; channel < channels; channel++) {
          const newData = trimmedBuffer.getChannelData(channel);
          const originalData = audioBuffer.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            newData[i] = originalData[startSample + i];
          }
        }

        const trimmedUrl = audioBufferToWav(trimmedBuffer);
        onTrimComplete(trimmedUrl);
      });
  };

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
    >
      <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl">
        <div className="space-y-6">
          {/* Waveform */}
          <div className="relative h-40 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            <canvas
              ref={waveformRef}
              className="w-full h-full"
              width={800}
              height={160}
            />
            
            {/* Trim handles */}
            <motion.div
              className="absolute inset-y-0 left-0 w-1 bg-blue-500 cursor-ew-resize"
              style={{ left: `${trimStart}%` }}
              drag="x"
              dragConstraints={containerRef}
              variants={handleVariants}
              whileHover="hover"
              whileTap="tap"
              onDrag={(_, info) => {
                const container = containerRef.current;
                if (!container) return;
                const newPosition = (info.point.x / container.offsetWidth) * 100;
                setTrimStart(Math.max(0, Math.min(trimEnd - 1, newPosition)));
              }}
            />
            
            <motion.div
              className="absolute inset-y-0 right-0 w-1 bg-blue-500 cursor-ew-resize"
              style={{ left: `${trimEnd}%` }}
              drag="x"
              dragConstraints={containerRef}
              variants={handleVariants}
              whileHover="hover"
              whileTap="tap"
              onDrag={(_, info) => {
                const container = containerRef.current;
                if (!container) return;
                const newPosition = (info.point.x / container.offsetWidth) * 100;
                setTrimEnd(Math.max(trimStart + 1, Math.min(100, newPosition)));
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayback}
              className="p-3 rounded-full bg-blue-500 text-white"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </motion.button>

            <div className="space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTrim}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Apply Trim
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer: AudioBuffer): string {
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
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(
        offset + (i * buffer.numberOfChannels + channel) * 2,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
    }
  }

  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
} 