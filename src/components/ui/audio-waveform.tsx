import React, { useRef, useEffect, useState } from 'react';

const AudioWaveform = ({ audioUrl, onTrimChange }) => {
  const canvasRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [isDragging, setIsDragging] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    const loadAudioData = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
        drawWaveform(buffer);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    loadAudioData();
  }, [audioUrl]);

  const drawWaveform = (buffer) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.fillStyle = 'rgb(30, 58, 138)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        1,
        Math.max(1, (max - min) * amp)
      );
    }

    // Draw trim handles
    drawTrimHandles();
  };

  const drawTrimHandles = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const handleWidth = 4;

    // Draw semi-transparent overlay for trimmed parts
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, (canvas.width * trimStart) / 100, canvas.height);
    ctx.fillRect((canvas.width * trimEnd) / 100, 0, canvas.width, canvas.height);

    // Draw trim handles
    ctx.fillStyle = 'rgb(59, 130, 246)';
    ctx.fillRect((canvas.width * trimStart) / 100 - handleWidth/2, 0, handleWidth, canvas.height);
    ctx.fillRect((canvas.width * trimEnd) / 100 - handleWidth/2, 0, handleWidth, canvas.height);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startX = (canvas.width * trimStart) / 100;
    const endX = (canvas.width * trimEnd) / 100;

    if (Math.abs(x - startX) < 10) {
      setIsDragging('start');
    } else if (Math.abs(x - endX) < 10) {
      setIsDragging('end');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !audioBuffer) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / canvas.width) * 100));

    if (isDragging === 'start' && percentage < trimEnd - 5) {
      setTrimStart(percentage);
    } else if (isDragging === 'end' && percentage > trimStart + 5) {
      setTrimEnd(percentage);
    }

    drawWaveform(audioBuffer);
    onTrimChange?.(trimStart, trimEnd);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <div className="relative w-full h-32 bg-blue-50 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default AudioWaveform;