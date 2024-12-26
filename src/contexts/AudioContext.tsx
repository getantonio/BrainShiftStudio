'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AudioContextType {
  globalVolume: number;
  setGlobalVolume: (volume: number) => void;
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
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
      setPlaylists
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