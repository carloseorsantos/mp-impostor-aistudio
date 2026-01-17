
import React, { useState, useEffect } from 'react';

interface Props {
  onReveal: () => void;
  t: any;
  isHost?: boolean;
}

const DiscussionPhase: React.FC<Props> = ({ onReveal, t, isHost }) => {
  const [seconds, setSeconds] = useState(180);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(prev => prev - 1), 1000);
    } else if (seconds === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 bg-[#0a1120] border border-cyan-900/30 rounded-2xl animate-in slide-in-from-top duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white">{t.timeToDiscuss}</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[300px]">{t.discussDesc}</p>
        </div>

        <div className="flex flex-col items-center bg-[#050b18] px-8 py-4 rounded-2xl border border-cyan-800/20 shadow-inner">
          <div className={`text-6xl font-mono font-black ${seconds < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-500'}`}>
            {formatTime(seconds)}
          </div>
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1">Countdown Active</span>
        </div>
        
        {isHost ? (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex gap-2">
               <button
                onClick={() => setIsActive(!isActive)}
                className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest active:scale-95 transition-all ${isActive ? 'bg-amber-600/20 text-amber-500 border border-amber-500/50' : 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50'}`}
              >
                {isActive ? t.pause : t.startTimer}
              </button>
              <button onClick={() => { setIsActive(false); setSeconds(180); }} className="px-4 py-3 bg-slate-800 rounded-lg text-xs font-black text-slate-400 active:scale-95">
                {t.reset}
              </button>
            </div>
            <button onClick={onReveal} className="w-full bg-cyan-600 text-white py-4 rounded-lg text-sm font-black uppercase tracking-widest shadow-lg shadow-cyan-600/20 active:scale-[0.98]">
              {t.whoWasIt}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-900/30 rounded-xl px-6 border border-slate-800">
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[8px] mb-1">Status</p>
            <p className="text-cyan-600 font-black text-[10px] animate-pulse">Monitoring signals from Host Control...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionPhase;
