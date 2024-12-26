'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PauseIcon, PlayIcon } from "@/components/icons/pause-play";

interface AudioWaveformProps {
 audioUrl: string;
 onTrimComplete?: (trimmedUrl: string) => void;
 volume?: number;
 isCompact?: boolean;
 onVolumeChange?: (volume: number) => void;
 onSave?: () => void;
 showControls?: boolean;
}

function audioBufferToWav(buffer: AudioBuffer): string {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const view = new DataView(new ArrayBuffer(44 + length));

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Write WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
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

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function AudioWaveform({ 
 audioUrl, 
 onTrimComplete, 
 volume = 1,
 isCompact = false,
 onVolumeChange,
 onSave,
 showControls = false
}: AudioWaveformProps) {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const audioRef = useRef<HTMLAudioElement>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [trimStart, setTrimStart] = useState(0);
 const [trimEnd, setTrimEnd] = useState(100);
 const isDraggingRef = useRef<'start' | 'end' | null>(null);
 const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
 const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
 const [currentTime, setCurrentTime] = useState(0);
 const animationFrameRef = useRef<number | null>(null);
 const [duration, setDuration] = useState(0);

 const drawWaveform = useCallback((buffer: AudioBuffer, trimStartPos = 0, trimEndPos = 100, playbackPosition = -1) => {
   const canvas = canvasRef.current;
   if (!canvas) return;

   const ctx = canvas.getContext('2d');
   if (!ctx) return;

   const data = buffer.getChannelData(0);
   const step = Math.ceil(data.length / canvas.width);
   const amp = canvas.height / 2;

   // Clear and set background
   ctx.fillStyle = '#1f3461';
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   // Draw waveform
   ctx.beginPath();
   ctx.strokeStyle = '#00FF00';
   ctx.lineWidth = 1;

   for (let i = 0; i < canvas.width; i++) {
     let min = 1.0;
     let max = -1.0;
     
     for (let j = 0; j < step; j++) {
       const datum = data[i * step + j];
       if (datum < min) min = datum;
       if (datum > max) max = datum;
     }

     ctx.moveTo(i, (1 + min) * amp);
     ctx.lineTo(i, (1 + max) * amp);
   }
   ctx.stroke();

   if (!isCompact) {
     // Draw trimmed area overlay with better visibility
     const startX = (canvas.width * trimStartPos) / 100;
     const endX = (canvas.width * trimEndPos) / 100;

     // Draw semi-transparent overlay for trimmed parts
     ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
     ctx.fillRect(0, 0, startX, canvas.height);
     ctx.fillRect(endX, 0, canvas.width - endX, canvas.height);

     // Draw trim handles with wider bars matching background
     ctx.fillStyle = '#1f3461'; // Match background color
     
     // Left handle - wider
     ctx.fillRect(startX - 8, 0, 16, canvas.height);
     ctx.fillStyle = '#FFFFFF';
     ctx.fillRect(startX - 1, canvas.height/2 - 20, 2, 40);

     // Right handle - wider
     ctx.fillStyle = '#1f3461'; // Match background color
     ctx.fillRect(endX - 8, 0, 16, canvas.height);
     ctx.fillStyle = '#FFFFFF';
     ctx.fillRect(endX - 1, canvas.height/2 - 20, 2, 40);

     // Draw playback position
     if (playbackPosition >= 0) {
       ctx.fillStyle = '#FFFFFF';
       ctx.fillRect(playbackPosition * canvas.width, 0, 2, canvas.height);
     }
   }
 }, [isCompact]);

 const updatePlaybackPosition = useCallback(() => {
   if (audioRef.current && audioBuffer && isPlaying) {
     const currentPos = audioRef.current.currentTime / audioRef.current.duration;
     setCurrentTime(currentPos);
     drawWaveform(audioBuffer, trimStart, trimEnd, currentPos);
     animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
   }
 }, [audioBuffer, drawWaveform, isPlaying, trimStart, trimEnd]);

 const handleMouseDown = (e: React.MouseEvent, handle: 'start' | 'end') => {
   if (isCompact) return;
   isDraggingRef.current = handle;
 };

 const handleMouseMove = (e: React.MouseEvent) => {
   if (isCompact || !isDraggingRef.current || !canvasRef.current) return;

   const canvas = canvasRef.current;
   const rect = canvas.getBoundingClientRect();
   const x = e.clientX - rect.left;
   const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

   if (isDraggingRef.current === 'start') {
     const newStart = Math.min(position, trimEnd - 1);
     setTrimStart(newStart);
     if (audioBuffer) {
       drawWaveform(audioBuffer, newStart, trimEnd, currentTime);
     }
   } else {
     const newEnd = Math.max(position, trimStart + 1);
     setTrimEnd(newEnd);
     if (audioBuffer) {
       drawWaveform(audioBuffer, trimStart, newEnd, currentTime);
     }
   }
 };

 const handleMouseUp = () => {
   isDraggingRef.current = null;
 };

 const resetTrim = () => {
   setTrimStart(0);
   setTrimEnd(100);
   if (originalBuffer) {
     setAudioBuffer(originalBuffer);
     drawWaveform(originalBuffer, 0, 100);
   }
 };

 const applyTrim = () => {
   if (!audioBuffer || !onTrimComplete) return;

   const startTime = (trimStart / 100) * audioBuffer.duration;
   const endTime = (trimEnd / 100) * audioBuffer.duration;
   const audioContext = new AudioContext();
   const sampleRate = audioBuffer.sampleRate;
   const channels = audioBuffer.numberOfChannels;
   const startSample = Math.floor(startTime * sampleRate);
   const endSample = Math.floor(endTime * sampleRate);
   const length = endSample - startSample;

   const trimmedBuffer = audioContext.createBuffer(channels, length, sampleRate);

   for (let channel = 0; channel < channels; channel++) {
     const newData = trimmedBuffer.getChannelData(channel);
     const originalData = audioBuffer.getChannelData(channel);
     for (let i = 0; i < length; i++) {
       newData[i] = originalData[startSample + i];
     }
   }

   const trimmedUrl = audioBufferToWav(trimmedBuffer);
   onTrimComplete(trimmedUrl);

   // Reset trim handles after applying trim
   setTrimStart(0);
   setTrimEnd(100);
 };

 const togglePlayback = () => {
   if (!audioRef.current) return;

   if (isPlaying) {
     audioRef.current.pause();
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
   } else {
     audioRef.current.play();
     animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
   }
   setIsPlaying(!isPlaying);
 };

 const stopPlayback = () => {
   if (audioRef.current) {
     audioRef.current.pause();
     audioRef.current.currentTime = 0;
     setIsPlaying(false);
     setCurrentTime(0);
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
   }
 };

 useEffect(() => {
   if (!audioUrl) return;

   const loadAudio = async () => {
     try {
       const response = await fetch(audioUrl);
       const arrayBuffer = await response.arrayBuffer();
       const audioContext = new AudioContext();
       const buffer = await audioContext.decodeAudioData(arrayBuffer);
       setAudioBuffer(buffer);
       setOriginalBuffer(buffer);
       drawWaveform(buffer, trimStart, trimEnd);
     } catch (error) {
       console.error('Error loading audio:', error);
     }
   };

   loadAudio();

   return () => {
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
   };
 }, [audioUrl, drawWaveform, trimStart, trimEnd]);

 useEffect(() => {
   if (audioRef.current) {
     audioRef.current.volume = Math.max(0, Math.min(1, volume || 0));
   }
 }, [volume]);

 useEffect(() => {
   const handleMouseUpGlobal = () => {
     if (isDraggingRef.current) {
       isDraggingRef.current = null;
     }
   };

   document.addEventListener('mouseup', handleMouseUpGlobal);
   return () => {
     document.removeEventListener('mouseup', handleMouseUpGlobal);
   };
 }, []);

 return (
   <div className="relative">
     <canvas
       ref={canvasRef}
       width={800}
       height={isCompact ? 48 : 200}
       className={`w-full rounded-lg ${isCompact ? 'h-12' : 'h-[200px] cursor-ew-resize'}`}
       onMouseDown={(e) => {
         const rect = canvasRef.current?.getBoundingClientRect();
         if (!rect) return;
         const x = e.clientX - rect.left;
         const position = (x / rect.width) * 100;
         
         // Determine which handle to drag based on proximity
         const startDistance = Math.abs(position - trimStart);
         const endDistance = Math.abs(position - trimEnd);
         
         if (startDistance < endDistance && startDistance < 5) {
           handleMouseDown(e, 'start');
         } else if (endDistance < 5) {
           handleMouseDown(e, 'end');
         }
       }}
       onMouseMove={handleMouseMove}
       onMouseUp={handleMouseUp}
       onMouseLeave={handleMouseUp}
     />
     {!isCompact && (
       <div className="space-y-4">
         <div className="flex justify-between">
           <div className="space-x-2">
             <Button onClick={togglePlayback}>
               {isPlaying ? 'Pause' : 'Play'}
             </Button>
             <Button onClick={stopPlayback}>
               Stop
             </Button>
           </div>
           <div className="space-x-2">
             <Button onClick={resetTrim}>Reset Trim</Button>
             <Button onClick={applyTrim}>Apply Trim</Button>
             {onSave && (
               <Button onClick={() => onSave()}>Save</Button>
             )}
           </div>
         </div>
         <div className="flex items-center space-x-2">
           <span>Volume:</span>
           <input
             type="range"
             min="0"
             max="1"
             step="0.1"
             value={volume}
             onChange={(e) => {
               const newVolume = parseFloat(e.target.value);
               if (audioRef.current) {
                 audioRef.current.volume = newVolume;
               }
               if (onVolumeChange) {
                 onVolumeChange(newVolume);
               }
             }}
             className="flex-1 accent-blue-500"
           />
           <span>{Math.round(volume * 100)}%</span>
         </div>
       </div>
     )}
     <audio
       ref={audioRef}
       src={audioUrl}
       onEnded={() => setIsPlaying(false)}
       onLoadedMetadata={() => {
         if (audioRef.current) {
           setDuration(audioRef.current.duration);
         }
       }}
       className="hidden"
     />

     {/* Playback Controls */}
     {showControls && (
       <div className="flex items-center space-x-2 mt-2">
         <button
           onClick={togglePlayback}
           className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
         >
           {isPlaying ? (
             <PauseIcon className="h-5 w-5" />
           ) : (
             <PlayIcon className="h-5 w-5" />
           )}
         </button>
         
         <div className="flex-1">
           <input
             type="range"
             min="0"
             max={duration}
             value={currentTime * duration}
             onChange={(e) => {
               const time = parseFloat(e.target.value);
               setCurrentTime(time / duration);
               if (audioRef.current) {
                 audioRef.current.currentTime = time;
               }
             }}
             className="w-full"
           />
         </div>
         
         <span className="text-sm">
           {formatTime(currentTime * duration)} / {formatTime(duration)}
         </span>
       </div>
     )}
   </div>
 );
}