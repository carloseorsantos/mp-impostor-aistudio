
import React from 'react';
import { playSound } from '../utils/sounds';

interface Props {
  onStartLocal: () => void;
  onStartOnline: () => void;
  t: any;
}

const HomeScreen: React.FC<Props> = ({ onStartLocal, onStartOnline, t }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-around py-4 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4 px-4">
        <div className="relative inline-block">
          <div className="text-9xl mb-2 drop-shadow-2xl animate-bounce">😈</div>
          <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-slate-900">HOT!</div>
        </div>
        <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-br from-indigo-400 via-purple-500 to-red-500 bg-clip-text text-transparent">
          {t.appName}
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-[280px] mx-auto leading-tight">
          {t.tagline}
        </p>
      </div>

      <div className="w-full space-y-4 px-4 pb-4">
        <button
          onClick={() => { playSound.tap(); onStartLocal(); }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all py-6 rounded-[2rem] text-2xl font-black shadow-2xl border-b-4 border-indigo-800"
        >
          {t.startGame}
        </button>

        <button
          onClick={() => { playSound.tap(); onStartOnline(); }}
          className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all py-5 rounded-[2rem] text-xl font-black shadow-xl border-b-4 border-slate-900 flex items-center justify-center gap-3"
        >
          <span>🌐</span> {t.onlineMultiplayer || 'ONLINE MULTIPLAYER'}
        </button>
        
        <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-700/50">
          <h2 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>📖</span> {t.howToPlay}
          </h2>
          <ul className="text-sm text-slate-300 space-y-3">
            {t.rules.map((rule: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-indigo-900/50 text-indigo-400 rounded-full flex items-center justify-center text-[10px] font-bold border border-indigo-500/30">{i + 1}</span>
                <span className="leading-tight">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
