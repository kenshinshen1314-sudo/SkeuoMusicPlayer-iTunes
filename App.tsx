
import React, { useState, useEffect, useRef } from 'react';
import Display from './components/Display';
import Knob from './components/Knob';
import Controls from './components/Controls';
import { PlayerState, Song } from './types';

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [selectorValue, setSelectorValue] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    volume: 70,
    isLiked: false,
    isHot: false,
    eqActive: false,
    fxActive: true,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchMusicData = async () => {
      try {
        setIsLoading(true);
        
        // Using iTunes Search API as a reliable source for preview_url.
        // Spotify Web API frequently returns null for preview_url due to recent licensing changes.
        // We search for a genre that matches the high-tech aesthetic (e.g., Electronic/Synth).
        const searchTerm = "synthwave"; 
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=25`);
        
        if (!res.ok) throw new Error("Music Database Connection Failed");
        
        const data = await res.json();
        
        if (data.resultCount === 0) {
          throw new Error("No signals detected in the cloud.");
        }

        const formattedSongs: Song[] = data.results.map((track: any) => {
          // Upgrade artwork resolution from 100x100 to 600x600 for high-DPI display
          const highResArt = track.artworkUrl100?.replace('100x100bb', '600x600bb');
          
          return {
            id: String(track.trackId),
            title: track.trackName,
            artist: track.artistName,
            albumArt: highResArt,
            audioUrl: track.previewUrl, // iTunes reliably returns .m4a previews
            duration: 29, // Previews are typically 30s, we clamp display for cleanliness
            lyrics: [
              { time: 0, text: '• SYSTEM LINK ESTABLISHED •' },
              { time: 4, text: `TRACK ID: ${track.trackId}` },
              { time: 8, text: 'DECODING FLAC STREAM...' },
              { time: 12, text: `ARTIST: ${track.artistName.toUpperCase()}` },
              { time: 16, text: 'AUDIO SPECTRUM: NORMAL' },
              { time: 20, text: 'BUFFER INTEGRITY: 100%' },
              { time: 24, text: '• REPEAT SEQUENCE •' },
            ]
          };
        });

        setSongs(formattedSongs);
        setIsLoading(false);
      } catch (error: any) {
        console.error("System Failure:", error);
        setErrorState(error.message || "Unknown Network Error");
        setIsLoading(false);
      }
    };

    fetchMusicData();
  }, []);

  const currentSong = songs[currentSongIndex];

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume / 100;
    }
  }, [state.volume]);

  // Audio Playback Lifecycle
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    // Reset audio source when song changes to ensure clean state
    if (currentSong.audioUrl !== audioRef.current.src) {
        audioRef.current.src = currentSong.audioUrl;
        audioRef.current.load();
    }

    if (state.isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Playback prevented by browser policy:", err);
          setState(prev => ({ ...prev, isPlaying: false }));
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying, currentSongIndex, currentSong]);

  // Handle Knob Selector (Snaps value to track index)
  useEffect(() => {
    if (songs.length === 0) return;
    const stepCount = 25;
    const notch = Math.round((selectorValue / 100) * (stepCount - 1));
    // Ensure we don't go out of bounds
    const safeIndex = Math.min(notch, songs.length - 1);
    const targetIndex = safeIndex % songs.length;
    
    if (targetIndex !== currentSongIndex) {
      setCurrentSongIndex(targetIndex);
      setState(prev => ({ ...prev, currentTime: 0, isPlaying: true }));
    }
  }, [selectorValue, songs.length]); 

  const togglePlayPause = () => setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));

  const handleNext = () => {
    const step = 100 / 24;
    setSelectorValue(prev => {
        const next = prev + step;
        return next > 100 ? 0 : next;
    });
  };

  const handlePrev = () => {
    const step = 100 / 24;
    setSelectorValue(prev => {
        const next = prev - step;
        return next < 0 ? 100 : next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f0f0] text-black/40 font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">
        Initializing Audio Core...
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f0f0] text-red-600/80 font-mono text-[11px] tracking-[0.2em] uppercase p-10 text-center leading-loose">
        <div className="mb-4 text-3xl">⚠️ SYSTEM ERROR</div>
        {errorState}
        <br/>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-10 border border-black/20 px-8 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          REBOOT SYSTEM
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      {/* Skeuomorphic Hardware Body */}
      <div className="w-[460px] bg-[#e0e0e0] rounded-[50px] p-8 shadow-[24px_24px_48px_#bebebe,-24px_-24px_48px_#ffffff] border-white/30 border-t border-l flex flex-col items-center">
        
        {/* LCD Screen Display */}
        {currentSong && <Display song={currentSong} state={state} trackIndex={currentSongIndex} />}

        {/* Knob Area */}
        <div className="flex justify-center w-full my-10">
          <Knob 
            value={selectorValue} 
            onChange={setSelectorValue}
            label="TRACK SELECTOR"
            subLabel="FREQUENCY TUNER"
            steps={25}
          />
        </div>

        {/* Physical Push Buttons */}
        <Controls 
          onPlayPause={togglePlayPause}
          onPrev={handlePrev}
          onNext={handleNext}
          isLiked={state.isLiked}
          onToggleLike={() => setState(prev => ({ ...prev, isLiked: !prev.isLiked }))}
          isHot={state.isHot}
          onToggleHot={() => setState(prev => ({ ...prev, isHot: !prev.isHot }))}
          eqActive={state.eqActive}
          onToggleEq={() => setState(prev => ({ ...prev, eqActive: !prev.eqActive }))}
          fxActive={state.fxActive}
          onToggleFx={() => setState(prev => ({ ...prev, fxActive: !prev.fxActive }))}
        />

        {/* System Status LED */}
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <div className="text-[10px] font-bold tracking-[0.4em] text-black/40">SYSTEM STATUS</div>
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-colors duration-500 ${state.isPlaying ? 'bg-green-500 shadow-green-500' : 'bg-red-500 shadow-red-500'}`} />
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        // src is managed in useEffect to prevent React re-render flicker
        onTimeUpdate={(e) => {
          const ct = e.currentTarget.currentTime;
          setState(prev => ({ ...prev, currentTime: ct }));
        }}
        onEnded={handleNext}
      />
    </div>
  );
};

export default App;
