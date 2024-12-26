'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface AudioContextType {
  globalVolume: number;
  setGlobalVolume: (volume: number) => void;
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
  stopCurrentAudio: () => void;
}

interface Playlist {
  id: string;
  name: string;
  tracks: PlaylistTrack[];
  isLooping: boolean;
  volume: number;
}

interface PlaylistTrack {
  id: string;
  name: string;
  url: string;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [globalVolume, setGlobalVolume] = useState(1);
  const [playlists, setPlaylists] = useState<Playlist[]>([{
    id: crypto.randomUUID(),
    name: "Default Playlist",
    tracks: [],
    isLooping: false,
    volume: 1
  }]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((audioElement: HTMLAudioElement) => {
    if (currentAudioRef.current === audioElement) {
      // If clicking the same audio, toggle play/pause
      if (audioElement.paused) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
    } else {
      // If different audio, stop current and play new
      stopCurrentAudio();
      currentAudioRef.current = audioElement;
      audioElement.volume = globalVolume;
      audioElement.play();
    }
  }, [stopCurrentAudio, globalVolume]);

  useEffect(() => {
    const handlePlay = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement !== currentAudioRef.current) {
        playAudio(audioElement);
      }
    };

    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, [playAudio]);

  // Update volume when global volume changes
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = globalVolume;
    }
  }, [globalVolume]);

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      try {
        const parsed = JSON.parse(savedPlaylists);
        // Ensure there's always at least one playlist
        if (parsed.length === 0) {
          setPlaylists([{
            id: crypto.randomUUID(),
            name: "Default Playlist",
            tracks: [],
            isLooping: false,
            volume: 1
          }]);
        } else {
          setPlaylists(parsed);
        }
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    const audioElements = document.getElementsByTagName('audio');
    Array.from(audioElements).forEach(audio => {
      const playlistVolume = playlists.find(p => 
        p.tracks.some(t => t.url === audio.src)
      )?.volume || 1;
      audio.volume = globalVolume * playlistVolume;
    });
  }, [globalVolume, playlists]);

  return (
    <AudioContext.Provider value={{
      globalVolume,
      setGlobalVolume,
      playlists,
      setPlaylists,
      stopCurrentAudio
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 