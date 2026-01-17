
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
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black tracking-tight">{t.timeToDiscuss}</h2>
        <p className="text-slate-400 text-lg px-8">{t.discussDesc}</p>
      </div>

      <div className="w-full bg-slate-800 rounded-[3rem] p-10 flex flex-col items-center shadow-inner border border-slate-700">
        <div className={`text-8xl font-mono font-bold mb-8 ${seconds < 30 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
          {formatTime(seconds)}
        </div>
        
        {isHost && (
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex-1 ${isActive ? 'bg-amber-600' : 'bg-emerald-600'} py-4 rounded-2xl font-black text-xl active:scale-95`}
            >
              {isActive ? t.pause : t.startTimer}
            </button>
            <button onClick={() => { setIsActive(false); setSeconds(180); }} className="p-4 bg-slate-700 rounded-2xl active:scale-95">
              {t.reset}
            </button>
          </div>
        )}
      </div>

      <div className="w-full space-y-4">
        {isHost ? (
          <button onClick={onReveal} className="w-full bg-indigo-600 py-6 rounded-[2rem] text-2xl font-black shadow-xl active:scale-95">
            {t.whoWasIt}
          </button>
        ) : (
          <div className="text-center py-6 animate-pulse-soft">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Waiting for host to reveal results...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionPhase;
