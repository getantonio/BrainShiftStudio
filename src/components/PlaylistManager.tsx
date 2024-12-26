'use client';

import React, { useState, useRef } from 'react';

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

interface PlaylistManagerProps {
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export function PlaylistManager({ playlists, onPlaylistsChange }: PlaylistManagerProps) {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayTrack = (trackId: string, trackUrl: string) => {
    if (currentPlayingId === trackId) {
      if (audioRef.current?.paused) {
        audioRef.current.play();
      } else {
        audioRef.current?.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = trackUrl;
        audioRef.current.play();
      } else {
        audioRef.current = new Audio(trackUrl);
        audioRef.current.play();
      }
      setCurrentPlayingId(trackId);
    }
  };

  const handleTrackEnd = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const currentIndex = playlist.tracks.findIndex(t => t.id === currentPlayingId);
    if (currentIndex === -1) return;

    if (playlist.isLooping && currentIndex === playlist.tracks.length - 1) {
      // If looping and at the end, play first track
      const firstTrack = playlist.tracks[0];
      handlePlayTrack(firstTrack.id, firstTrack.url);
    } else if (currentIndex < playlist.tracks.length - 1) {
      // Play next track
      const nextTrack = playlist.tracks[currentIndex + 1];
      handlePlayTrack(nextTrack.id, nextTrack.url);
    }
  };

  const handleCreatePlaylist = () => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: `Playlist ${playlists.length + 1}`,
      tracks: [],
      isLooping: false,
      volume: 1
    };
    onPlaylistsChange([...playlists, newPlaylist]);
  };

  const handleDeletePlaylist = (id: string) => {
    onPlaylistsChange(playlists.filter(p => p.id !== id));
  };

  const handleToggleLoop = (id: string) => {
    onPlaylistsChange(
      playlists.map(p => 
        p.id === id ? { ...p, isLooping: !p.isLooping } : p
      )
    );
  };

  const handleVolumeChange = (id: string, volume: number) => {
    onPlaylistsChange(
      playlists.map(p => 
        p.id === id ? { ...p, volume } : p
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Playlists</h2>
        <button
          onClick={handleCreatePlaylist}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          New Playlist
        </button>
      </div>

      <div className="space-y-4">
        {playlists.map(playlist => (
          <div
            key={playlist.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{playlist.name}</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleToggleLoop(playlist.id)}
                  className={`p-2 rounded-lg ${
                    playlist.isLooping ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  🔁
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={playlist.volume}
                  onChange={(e) => handleVolumeChange(playlist.id, parseFloat(e.target.value))}
                  className="w-24"
                />
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="p-2 text-red-500"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Updated Playlist tracks */}
            <div className="space-y-2">
              {playlist.tracks.map(track => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span>{track.name}</span>
                  <button 
                    className="p-2"
                    onClick={() => handlePlayTrack(track.id, track.url)}
                  >
                    {currentPlayingId === track.id ? '⏸️' : '▶️'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <audio
        ref={audioRef}
        onEnded={() => {
          if (currentPlayingId) {
            const playlistId = playlists.find(p => 
              p.tracks.some(t => t.id === currentPlayingId)
            )?.id;
            if (playlistId) handleTrackEnd(playlistId);
          }
        }}
      />
    </div>
  );
} 