"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";

/**
 * AudioWaveformProps:
 * - `audioUrl`: A URL (or Blob URL) to the audio file
 * - `onTrimComplete`: Optional callback after trimming completes,
 *   which receives the newly trimmed audio URL.
 */
interface AudioWaveformProps {
  audioUrl: string;
  onTrimComplete?: (trimmedUrl: string) => void;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioUrl,
  onTrimComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Decoded audio data
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Trim boundaries (0–100%).
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);

  // Track which handle is being dragged
  const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | null>(
    null
  );

  // Whether to show "Confirm" and "Reset" buttons
  const [showControls, setShowControls] = useState(false);

  /**
   * drawOverlayAndHandles:
   * Draws the semi-transparent overlay and thick blue handles.
   * No external dependencies => empty dep array => stable reference.
   */
  const drawOverlayAndHandles = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      startPercent: number,
      endPercent: number
    ) => {
      const { width, height } = ctx.canvas;
      const startX = (startPercent / 100) * width;
      const endX = (endPercent / 100) * width;

      // Overlay for trimmed region
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, startX, height);
      ctx.fillRect(endX, 0, width - endX, height);

      // Thick handles
      const handleWidth = 16;
      ctx.fillStyle = "#00d2ff"; // bright cyan for the handles
      // left handle
      ctx.fillRect(startX - handleWidth / 2, 0, handleWidth, height);
      // right handle
      ctx.fillRect(endX - handleWidth / 2, 0, handleWidth, height);

      // "Grip" dots on each handle
      ctx.fillStyle = "#333"; // darker color for visible contrast
      for (let i = 0; i < 3; i++) {
        const offsetY = height / 2 - 12 + i * 12;
        // left handle
        ctx.fillRect(startX - handleWidth / 2 + 4, offsetY, 4, 4);
        // right handle
        ctx.fillRect(endX - handleWidth / 2 + 4, offsetY, 4, 4);
      }
    },
    []
  );

  /**
   * drawWaveform:
   * Draws the waveform in green, with a blue gradient background,
   * then calls `drawOverlayAndHandles`.
   *
   * Must include `drawOverlayAndHandles` in dep array, since it's used here.
   */
  const drawWaveform = useCallback(
    (buffer: AudioBuffer, startPercent: number, endPercent: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill canvas with a dark blue gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#152545");
      gradient.addColorStop(1, "#1f3461");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the waveform in green
      const data = buffer.getChannelData(0); // just first channel
      const step = Math.ceil(data.length / canvas.width);
      const amp = canvas.height / 2;

      ctx.strokeStyle = "green";
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
          const idx = i * step + j;
          if (idx < data.length) {
            const val = data[idx];
            if (val < min) min = val;
            if (val > max) max = val;
          }
        }
        const x = i;
        const y1 = (1 + min) * amp;
        const y2 = (1 + max) * amp;
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
      }
      ctx.stroke();

      // Draw overlay + handles
      drawOverlayAndHandles(ctx, startPercent, endPercent);
    },
    [drawOverlayAndHandles]
  );

  /**
   * useEffect: When `audioUrl` changes, fetch & decode the audio,
   * then draw the waveform from 0–100%.
   *
   * Must include `drawWaveform` in dependency array to fix the ESLint warning.
   */
  useEffect(() => {
    if (!audioUrl) {
      setAudioBuffer(null);
      return;
    }

    (async () => {
      try {
        const resp = await fetch(audioUrl);
        const arrayBuf = await resp.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(arrayBuf);
        setAudioBuffer(decoded);
        setTrimStart(0);
        setTrimEnd(100);
        setShowControls(false);
        drawWaveform(decoded, 0, 100);
      } catch (err) {
        console.error("Error decoding audio:", err);
      }
    })();
  }, [audioUrl, drawWaveform]);

  // Handle pointer events for dragging
  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const startX = (trimStart / 100) * rect.width;
    const endX = (trimEnd / 100) * rect.width;
    const handleHitRange = 20;

    if (Math.abs(x - startX) < handleHitRange) {
      setDraggingHandle("start");
    } else if (Math.abs(x - endX) < handleHitRange) {
      setDraggingHandle("end");
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingHandle || !canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

    if (draggingHandle === "start") {
      // enforce a minimum 5% gap
      if (percent < trimEnd - 5) {
        setTrimStart(percent);
        setShowControls(true);
        drawWaveform(audioBuffer, percent, trimEnd);
      }
    } else {
      // draggingHandle === 'end'
      if (percent > trimStart + 5) {
        setTrimEnd(percent);
        setShowControls(true);
        drawWaveform(audioBuffer, trimStart, percent);
      }
    }
  };

  const handlePointerUp = () => {
    setDraggingHandle(null);
  };

  // Reset everything to full audio
  const handleReset = () => {
    if (!audioBuffer) return;
    setTrimStart(0);
    setTrimEnd(100);
    setShowControls(false);
    drawWaveform(audioBuffer, 0, 100);
  };

  // Confirm Trim: produce a new Blob URL containing just the selected portion
  const handleConfirmTrim = async () => {
    if (!audioBuffer) return;
    try {
      const ctx = new AudioContext();
      const duration = audioBuffer.duration;
      const startSec = (trimStart / 100) * duration;
      const endSec = (trimEnd / 100) * duration;
      const trimmedLength = Math.floor(
        (endSec - startSec) * audioBuffer.sampleRate
      );

      const newBuffer = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
      );

      // Copy portion
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const src = audioBuffer.getChannelData(channel);
        const dest = newBuffer.getChannelData(channel);
        const startOffset = Math.floor(startSec * audioBuffer.sampleRate);
        for (let i = 0; i < trimmedLength; i++) {
          dest[i] = src[startOffset + i];
        }
      }

      // Convert to WAV
      const offlineCtx = new OfflineAudioContext(
        newBuffer.numberOfChannels,
        trimmedLength,
        newBuffer.sampleRate
      );
      const source = offlineCtx.createBufferSource();
      source.buffer = newBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      const rendered = await offlineCtx.startRendering();
      const trimmedBlob = audioBufferToWav(rendered);
      const trimmedUrl = URL.createObjectURL(trimmedBlob);

      // Fire the callback if provided
      onTrimComplete?.(trimmedUrl);
      setShowControls(false);
    } catch (error) {
      console.error("Error trimming audio:", error);
    }
  };

  // Convert AudioBuffer -> WAV
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    // Interleave channels
    const result = interleave(buffer);
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = result.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const view = new DataView(new ArrayBuffer(bufferSize));

    /* RIFF chunk descriptor */
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");

    /* FMT sub-chunk */
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    /* data sub-chunk */
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < result.length; i++) {
      const s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  };

  // Interleave multi-channel data
  const interleave = (buffer: AudioBuffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels;
    const data = new Float32Array(length);

    let index = 0;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numOfChannels; ch++) {
        data[index++] = buffer.getChannelData(ch)[i];
      }
    }
    return data;
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  return (
    <div className="space-y-4">
      {/* Waveform canvas */}
      <div className="relative overflow-hidden rounded-lg" style={{ height: "150px" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={150}
          className="w-full h-[150px] cursor-col-resize touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Confirm/Reset Buttons */}
      {showControls && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={handleConfirmTrim}>
            Confirm Trim
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;
