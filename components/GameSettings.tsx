
import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import { Language } from '../types';
import { playSound } from '../utils/sounds';

interface Props {
  playerCount: number;
  onStart: (category: string, impostors: number) => void;
  onBack: () => void;
  t: any;
  lang: Language;
}

const GameSettings: React.FC<Props> = ({ playerCount, onStart, onBack, t, lang }) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [impostorCount, setImpostorCount] = useState(1);

  const maxImpostors = Math.max(1, Math.floor(playerCount / 3));

  const handleCategorySelect = (id: string) => {
    playSound.tap();
    setSelectedCategory(id);
  };

  const handleImpostorSelect = (n: number) => {
    playSound.tap();
    setImpostorCount(n);
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 font-bold text-sm uppercase tracking-widest">
          ← {t.back}
        </button>
        <h2 className="text-xl font-black uppercase tracking-tight">{t.gameSettings}</h2>
        <div className="w-10"></div>
      </div>

      <div className="space-y-4">
        <label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] ml-2">{t.selectCategory}</label>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 group active:scale-[0.97] ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500'
              }`}
            >
              <span className={`text-4xl transition-transform ${selectedCategory === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {cat.icon}
              </span>
              <span className={`font-black text-xs uppercase tracking-widest ${selectedCategory === cat.id ? 'text-indigo-300' : 'text-slate-400'}`}>
                {cat.translations[lang].name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">{t.impostorCount}</label>
          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-500/30">
            {impostorCount} IMPOSTORS 😈
          </span>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              disabled={n > maxImpostors}
              onClick={() => handleImpostorSelect(n)}
              className={`flex-1 py-5 rounded-2xl font-black text-xl border-2 transition-all active:scale-95 ${
                n > maxImpostors 
                  ? 'opacity-10 bg-slate-900 border-slate-800 pointer-events-none grayscale'
                  : impostorCount === n
                    ? 'bg-red-600/20 border-red-500 text-red-400 shadow-lg shadow-red-600/10'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {maxImpostors === 1 && (
          <p className="text-[10px] text-slate-500 font-bold text-center italic uppercase tracking-wider">{t.morePlayersNeeded}</p>
        )}
      </div>

      <div className="flex-1"></div>

      <div className="pb-4 safe-bottom">
        <button
          onClick={() => {
            playSound.tap();
            onStart(selectedCategory, impostorCount);
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all py-6 rounded-[2rem] text-2xl font-black shadow-2xl shadow-indigo-600/30 border-b-4 border-indigo-800"
        >
          {t.confirmReveal}
        </button>
      </div>
    </div>
  );
};

export default GameSettings;
