'use client';

import React, { useState, useRef, useEffect } from "react";
import AudioWaveform from "@/components/AudioWaveform";
import { Button } from "@/components/ui/button";
import { TrashIcon, ChevronDown, ChevronRight } from "lucide-react";
import { getRandomAffirmations } from "@/utils/affirmationUtils";
import { affirmationCategories } from "@/data/affirmations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudio } from "@/contexts/AudioContext";
import { LiveWaveform } from "@/components/LiveWaveform";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { AffirmationWorkshop } from "@/components/AffirmationWorkshop";

const DARK_MODE_CLASS = "dark";

interface GuideSection {
  title: string;
  content: string[];
}

const SELF_HYPNOSIS_GUIDE: GuideSection[] = [
  {
    title: "Understanding Self-Hypnosis",
    content: [
      "Find a quiet, comfortable space",
      "Set aside 15-20 minutes of uninterrupted time",
      "Approach with an open and receptive mindset",
      "Remember: you are always in control"
    ]
  },
  {
    title: "The Power of Your Own Voice",
    content: [
      "Speak in a calm, soothing tone",
      "Use clear, positive language",
      "Maintain a steady rhythm",
      "Record in a quiet environment"
    ]
  },
  {
    title: "Set Your Intention",
    content: [
      "Define your specific goal",
      "Frame intentions positively",
      "Be realistic and specific",
      "Write down your intentions before recording"
    ]
  },
  {
    title: "Choose a Quiet Environment",
    content: [
      "Minimize background noise",
      "Turn off phone notifications",
      "Use sound dampening if possible",
      "Consider recording during quiet hours"
    ]
  },
  {
    title: "Relaxation Process",
    content: [
      "Start with deep breathing",
      "Progressive muscle relaxation",
      "Visualize a peaceful place",
      "Use countdown techniques"
    ]
  },
  {
    title: "Mental Focus & Visualization",
    content: [
      "Create vivid mental images",
      "Engage all your senses",
      "Stay present in the moment",
      "Practice regular visualization"
    ]
  },
  {
    title: "Voice Recording Techniques",
    content: [
      "Speak slightly slower than normal",
      "Use natural pauses",
      "Maintain consistent volume",
      "End recordings with gentle awakening"
    ]
  },
  {
    title: "Building a Practice",
    content: [
      "Start with short sessions",
      "Practice regularly",
      "Keep a progress journal",
      "Adjust techniques as needed"
    ]
  },
  {
    title: "Subliminal Enhancement",
    content: [
      "Layer positive affirmations",
      "Use background sounds mindfully",
      "Consider binaural beats",
      "Test different audio combinations"
    ]
  }
];

const formatVolume = (vol: number) => {
  const db = 20 * Math.log10(vol);
  return `${Math.round(vol * 100)}% (${db.toFixed(1)} dB)`;
};

export default function AffirmationsPage() {
  // Audio states
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // UI states
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [recordingName, setRecordingName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentAffirmations, setCurrentAffirmations] = useState<string[]>([]);
  const [showAffirmations, setShowAffirmations] = useState(false);
  const [isCategoryVisible, setIsCategoryVisible] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Global audio context
  const { globalVolume, setGlobalVolume, playlists, setPlaylists } = useAudio();

  // Add new state for playlist playback
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const currentPlaylistRef = useRef<number>(0);

  // Add new state for collapsed playlists
  const [collapsedPlaylists, setCollapsedPlaylists] = useState<Set<string>>(new Set());

  // Add state for playlist selection
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');

  // Add drag state
  const [draggedTrack, setDraggedTrack] = useState<{id: string, playlistId: string} | null>(null);

  // Add state for workshop visibility
  const [showWorkshop, setShowWorkshop] = useState(false);

  // Add state for guide visibility
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Add useEffect to set default playlist
  useEffect(() => {
    if (playlists.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlists, selectedPlaylistId]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add(DARK_MODE_CLASS);
      } else {
        document.documentElement.classList.remove(DARK_MODE_CLASS);
      }
      return newValue;
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 48000
        } 
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Set default recording name
        setRecordingName(`Recording ${playlists[0]?.tracks.length + 1 || 1}`);
      };
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const saveToPlaylist = () => {
    if (!audioUrl || !recordingName || !selectedPlaylistId) {
      alert('Please select a playlist and enter a name');
      return;
    }

    const audio = new Audio(audioUrl);
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      if (isNaN(duration) || !isFinite(duration)) {
        console.error('Invalid audio duration');
        alert('Error saving audio. Please try recording again.');
        return;
      }

      fetch(audioUrl)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const newTrack = {
              id: crypto.randomUUID(),
              name: recordingName,
              url: base64data,
              duration: duration
            };

            setPlaylists(playlists.map(p => 
              p.id === selectedPlaylistId ? {
                ...p,
                tracks: [...p.tracks, newTrack]
              } : p
            ));
            setAudioUrl(null);
            setRecordingName('');
            setSelectedPlaylistId('');
          };
          reader.readAsDataURL(blob);
        });
    });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category !== "create") {
      const newAffirmations = getRandomAffirmations(category, 5);
      setCurrentAffirmations(newAffirmations);
    } else {
      setCurrentAffirmations([]); // Clear affirmations when switching to workshop
    }
  };

  useEffect(() => {
    handleCategoryChange("all");
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const discardRecording = () => {
    setAudioUrl(null);
    setRecordingName('');
  };

  // Add playlist control functions
  const playPlaylist = (playlistIndex: number) => {
    setIsPlayingPlaylist(true);
    currentPlaylistRef.current = playlistIndex;
    setCurrentTrackIndex(0);
    
    // Start playing the first track
    const playlist = playlists[playlistIndex];
    if (playlist && playlist.tracks.length > 0) {
      const audioElement = new Audio(playlist.tracks[0].url);
      audioElement.volume = globalVolume * playlist.volume;
      audioElement.play();
      
      // Set up the onended event to play next track
      audioElement.onended = () => {
        if (currentTrackIndex < playlist.tracks.length - 1) {
          setCurrentTrackIndex(prev => prev + 1);
          const nextTrack = playlist.tracks[currentTrackIndex + 1];
          audioElement.src = nextTrack.url;
          audioElement.play();
        } else if (playlist.isLooping) {
          setCurrentTrackIndex(0);
          audioElement.src = playlist.tracks[0].url;
          audioElement.play();
        } else {
          setIsPlayingPlaylist(false);
          setCurrentTrackIndex(0);
        }
      };
    }
  };

  const stopPlaylist = () => {
    setIsPlayingPlaylist(false);
    setCurrentTrackIndex(0);
  };

  // Add toggle function
  const togglePlaylistCollapse = (playlistId: string) => {
    setCollapsedPlaylists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 space-y-6">
      {/* Header */}
      <div className="text-center relative py-4">
        {/* Position the toggle in the top-right of the header */}
        <div className="absolute right-0 top-0">
          <ModeToggle 
            isDark={isDarkMode} 
            onToggle={toggleDarkMode} 
          />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Affirmations Studio
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Transform your self-talk into positive affirmations
        </p>
      </div>

      {/* Self-Hypnosis Guide */}
      <div className="bg-white shadow-lg rounded-2xl p-6 dark:bg-gray-800">
        <button
          className="w-full flex justify-between items-center"
          onClick={() => setIsGuideVisible(!isGuideVisible)}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Self-Hypnosis Guide
          </h2>
          <span className="text-2xl text-gray-600 dark:text-gray-300">
            {isGuideVisible ? '−' : '+'}
          </span>
        </button>

        {isGuideVisible && (
          <div className="mt-4 space-y-4">
            {SELF_HYPNOSIS_GUIDE.map((section) => (
              <div key={section.title} className="border-b dark:border-gray-700">
                <button
                  className="w-full py-2 flex justify-between items-center text-left"
                  onClick={() => setExpandedSection(
                    expandedSection === section.title ? null : section.title
                  )}
                >
                  <span className="text-base font-medium">{section.title}</span>
                  <ChevronDown 
                    className={`w-6 h-6 transition-transform ${
                      expandedSection === section.title ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedSection === section.title && (
                  <div className="pb-2">
                    <ul className="list-disc pl-6 space-y-1">
                      {section.content.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Category Selection */}
      <div className="bg-white shadow-lg rounded-2xl p-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Affirmations
          </h2>
          <Button
            variant="outline"
            onClick={() => setShowWorkshop(!showWorkshop)}
          >
            {showWorkshop ? 'View Categories' : 'Create Your Own'}
          </Button>
        </div>

        {showWorkshop ? (
          <div className="space-y-6">
            <AffirmationWorkshop />
          </div>
        ) : (
          <>
            <button
              className="w-full flex justify-between items-center"
              onClick={() => setIsCategoryVisible(!isCategoryVisible)}
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Choose Category
              </h3>
              <span className="text-2xl text-gray-600 dark:text-gray-300">
                {isCategoryVisible ? '−' : '+'}
              </span>
            </button>

            {isCategoryVisible && (
              <div className="mt-4 space-y-4">
                <Select 
                  value={selectedCategory} 
                  onValueChange={(category) => {
                    setSelectedCategory(category);
                    handleCategoryChange(category);
                    setShowAffirmations(true);
                  }}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="h-12 text-base">
                      All Categories
                    </SelectItem>
                    {affirmationCategories.map((category) => (
                      <SelectItem 
                        key={category.id}
                        value={category.id}
                        className="h-12 text-base"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {showAffirmations && (
                  <div className="space-y-3">
                    {currentAffirmations.map((affirmation, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-base leading-relaxed"
                      >
                        {affirmation}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Recording Section - Enhanced visual hierarchy */}
      <div className="bg-white shadow-lg rounded-2xl p-6 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Record Your Affirmation
        </h2>
        <div className="space-y-6">
          <div className="flex justify-center">
            <Button 
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              className="h-12 px-8 text-base" // Increased touch target
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>

          {isRecording && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-red-500 text-xl font-medium animate-pulse">
                  Recording
                </div>
                <div className="text-lg font-mono">
                  {formatTime(recordingTime)}
                </div>
              </div>
              <LiveWaveform isRecording={isRecording} />
            </div>
          )}

          {audioUrl && (
            <div className="space-y-6">
              <AudioWaveform
                audioUrl={audioUrl}
                onTrimComplete={(trimmedUrl) => setAudioUrl(trimmedUrl)}
                volume={volume}
              />
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={recordingName}
                  onChange={(e) => setRecordingName(e.target.value)}
                  placeholder="Enter recording name"
                  className="flex-1 h-12 px-4 text-base border rounded-xl dark:bg-gray-700"
                />
                <Select
                  value={selectedPlaylistId}
                  onValueChange={setSelectedPlaylistId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {playlists.map(playlist => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={saveToPlaylist}
                  disabled={!selectedPlaylistId}
                  className="h-12 px-6 text-base"
                >
                  Save to Playlist
                </Button>
                <Button 
                  onClick={discardRecording}
                  variant="destructive"
                  className="h-12 px-6 text-base"
                >
                  Discard
                </Button>
              </div>
              
              {/* Volume Control - Improved visual feedback */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-base">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Playlist Section with Full Controls */}
      <div className="bg-white shadow-lg rounded-2xl p-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Playlists
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Global Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={globalVolume}
              onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
              className="w-24"
            />
            <Button 
              onClick={() => {
                const newPlaylist = {
                  id: crypto.randomUUID(),
                  name: `Playlist ${playlists.length + 1}`,
                  tracks: [],
                  isLooping: false,
                  volume: 1
                };
                setPlaylists([...playlists, newPlaylist]);
              }}
              className="h-10 px-4"
            >
              New Playlist
            </Button>
          </div>
        </div>

        {playlists.length === 0 ? (
          <p className="text-base text-gray-600 dark:text-gray-400">
            No playlists created yet
          </p>
        ) : (
          <div className="space-y-6">
            {playlists.map((playlist, index) => (
              <div 
                key={playlist.id}
                className="border dark:border-gray-700 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => togglePlaylistCollapse(playlist.id)}
                      className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
                    >
                      {collapsedPlaylists.has(playlist.id) ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <h3 className="text-lg font-medium">{playlist.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({playlist.tracks.length} tracks)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => isPlayingPlaylist ? stopPlaylist() : playPlaylist(index)}
                      variant="outline"
                      className="h-8 px-3"
                    >
                      {isPlayingPlaylist && currentPlaylistRef.current === index ? '⏹️' : '▶️'}
                    </Button>
                    <button
                      onClick={() => {
                        setPlaylists(playlists.map(p => 
                          p.id === playlist.id ? { ...p, isLooping: !p.isLooping } : p
                        ));
                      }}
                      className={`p-1.5 rounded-lg ${
                        playlist.isLooping ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      🔁
                    </button>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={playlist.volume}
                        onChange={(e) => {
                          const newVolume = parseFloat(e.target.value);
                          setPlaylists(playlists.map(p => 
                            p.id === playlist.id ? { ...p, volume: newVolume } : p
                          ));
                        }}
                        className="w-24 h-2 accent-blue-500 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${playlist.volume * 100}%, #e5e7eb ${playlist.volume * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <span className="w-24 text-xs font-mono">
                        {formatVolume(playlist.volume)}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPlaylists(playlists.filter(p => p.id !== playlist.id));
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {!collapsedPlaylists.has(playlist.id) && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900');
                      if (draggedTrack && draggedTrack.playlistId !== playlist.id) {
                        const sourcePlaylist = playlists.find(p => p.id === draggedTrack.playlistId);
                        const track = sourcePlaylist?.tracks.find(t => t.id === draggedTrack.id);
                        if (track) {
                          setPlaylists(playlists.map(p => {
                            if (p.id === draggedTrack.playlistId) {
                              return {
                                ...p,
                                tracks: p.tracks.filter(t => t.id !== draggedTrack.id)
                              };
                            }
                            if (p.id === playlist.id) {
                              return {
                                ...p,
                                tracks: [...p.tracks, track]
                              };
                            }
                            return p;
                          }));
                        }
                      }
                    }}
                    className="mt-3 space-y-1 transition-colors"
                  >
                    {playlist.tracks.map((track) => (
                      <div
                        key={track.id}
                        draggable
                        onDragStart={() => setDraggedTrack({ id: track.id, playlistId: playlist.id })}
                        onDragEnd={() => setDraggedTrack(null)}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move"
                      >
                        <span className="flex-none w-24 truncate text-sm">{track.name}</span>
                        <div className="flex-1 min-w-0">
                          <AudioWaveform
                            audioUrl={track.url}
                            volume={globalVolume * playlist.volume}
                            isCompact={true}
                            showControls={true}
                          />
                        </div>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setPlaylists(playlists.map(p => 
                              p.id === playlist.id ? {
                                ...p,
                                tracks: p.tracks.filter(t => t.id !== track.id)
                              } : p
                            ));
                          }}
                          className="h-8 w-8 p-0 flex-none"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}