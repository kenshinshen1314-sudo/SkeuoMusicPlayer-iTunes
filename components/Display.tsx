import React, { useMemo } from 'react';
import { Mic, Battery, Wifi } from 'lucide-react';
import { Song, PlayerState } from '../types';

interface DisplayProps {
  song: Song;
  state: PlayerState;
  trackIndex: number;
}

const Display: React.FC<DisplayProps> = ({ song, state, trackIndex }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (state.currentTime / (song.duration || 1)) * 100;

  const currentLyricIndex = useMemo(() => {
    let index = 0;
    if (!song.lyrics) return 0;
    for (let i = 0; i < song.lyrics.length; i++) {
      if (state.currentTime >= song.lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [state.currentTime, song.lyrics]);

  return (
    <div className="bg-[#121212] text-white p-5 rounded-3xl w-full h-64 flex flex-col relative overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] border border-white/5">
      {/* 顶部状态栏 */}
      <div className="flex justify-between items-center text-[10px] opacity-40 mb-4 font-mono tracking-wider shrink-0">
        <div className="flex items-center gap-2">
          <Wifi size={12} className="text-green-500" />
          <span>HI-FI CLOUD LINK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-green-400">100%</span>
          <Battery size={12} className="text-green-400" />
        </div>
      </div>

      <div className="flex flex-1 gap-6 items-center min-h-0">
        {/* 优化后的封面显示：左侧中间 */}
        <div className="relative group shrink-0 z-10">
          {/* 背景发光层 */}
          <div className="absolute -inset-1 bg-white/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.5)] border border-white/10">
            <img 
              src={song.albumArt} 
              alt="Album Art" 
              className={`w-full h-full object-cover transition-transform duration-700 ${state.isPlaying ? 'scale-110' : 'scale-100'}`} 
            />
            {/* 屏幕玻璃反光效果 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>
          
          {/* 封面倒影效果 */}
          <div 
            className="absolute top-full left-0 w-full h-12 pointer-events-none"
            style={{
              transform: 'scaleY(-1)',
              opacity: 0.25,
              maskImage: 'linear-gradient(black, transparent)',
              WebkitMaskImage: 'linear-gradient(black, transparent)',
            }}
          >
            <img src={song.albumArt} alt="" className="w-full h-full object-cover rounded-xl blur-[0.5px]" />
          </div>
        </div>

        {/* 中间歌曲信息 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
          <h2 className="text-sm font-bold leading-tight truncate w-full tracking-tight mb-0.5">{song.title}</h2>
          <p className="text-[10px] text-green-500/70 font-medium truncate w-full uppercase tracking-widest mb-3">{song.artist}</p>

          {/* 进度控制条 */}
          <div className="w-full px-1">
             <div className="flex justify-between text-[8px] opacity-30 mb-1.5 w-full font-mono tracking-tighter">
              <span>{formatTime(state.currentTime)}</span>
              <span>{formatTime(song.duration)}</span>
            </div>
            <div className="relative h-1 bg-white/5 w-full rounded-full overflow-visible">
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 ease-linear shadow-[0_0_8px_#fff]"
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="absolute -top-[3px] w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] border-2 border-[#121212] transition-all duration-300 ease-linear"
                style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
        </div>

        {/* 右侧歌词滚动 */}
        <div className="w-28 h-full flex flex-col items-start justify-center overflow-hidden relative border-l border-white/5 pl-4">
          <div 
            className="transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ transform: `translateY(${-(currentLyricIndex * 20) + 60}px)` }}
          >
            {(song.lyrics || []).map((l, idx) => (
              <p 
                key={idx} 
                className={`text-[9px] leading-5 transition-all duration-500 uppercase tracking-wide ${idx === currentLyricIndex ? 'text-white opacity-100 font-bold scale-105 origin-left' : 'opacity-10 text-white'}`}
              >
                {l.text}
              </p>
            ))}
          </div>
          {/* 上下遮罩阴影 */}
          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-[#121212] to-transparent z-10" />
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#121212] to-transparent z-10" />
        </div>
      </div>

      {/* 底部系统参数 */}
      <div className="flex justify-between items-center text-[8px] opacity-30 mt-3 font-mono uppercase tracking-[0.2em] shrink-0">
        <div className="flex gap-4">
          <span>SRC: 24BIT/96KHZ</span>
          <span>CH: STEREO</span>
        </div>
        <div className="flex gap-3 items-center">
          <span>TRK {trackIndex + 1}/25</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_4px_#22c55e]" />
        </div>
      </div>
    </div>
  );
};

export default Display;