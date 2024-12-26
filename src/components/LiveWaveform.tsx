'use client';

import React, { useRef, useEffect } from 'react';

interface LiveWaveformProps {
  isRecording: boolean;
}

export function LiveWaveform({ isRecording }: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (isRecording) {
      navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 48000
        } 
      })
        .then(stream => {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          const gain = audioContext.createGain();
          
          // Configure analyser for better visualization
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.2;
          
          // Boost the signal
          gain.gain.value = 2.5;
          
          source.connect(gain);
          gain.connect(analyser);
          gainRef.current = gain;
          analyserRef.current = analyser;

          const drawWaveform = () => {
            const canvas = canvasRef.current;
            if (!canvas || !analyserRef.current) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            analyserRef.current.getFloatTimeDomainData(dataArray);

            ctx.fillStyle = '#1f3461';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00FF00';
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            // Find max amplitude in this frame
            let maxAmp = 0;
            for (let i = 0; i < bufferLength; i++) {
              const amp = Math.abs(dataArray[i]);
              if (amp > maxAmp) maxAmp = amp;
            }

            // Dynamic scaling based on input level
            const scale = Math.min(2, Math.max(1, 1 / maxAmp));

            for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] * scale;
              const y = (0.5 + v * 0.5) * canvas.height;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }

              x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            animationFrameRef.current = requestAnimationFrame(drawWaveform);
          };

          drawWaveform();
        });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
      }
    };
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={65}
      className="w-full h-[65px] rounded-lg bg-[#1f3461]"
    />
  );
} 