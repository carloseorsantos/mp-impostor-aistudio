
import React, { useState } from 'react';
import { GameConfig } from '../types';
import { playSound } from '../utils/sounds';

interface Props {
  config: GameConfig;
  onRestart: () => void;
  t: any;
}

const ResultPhase: React.FC<Props> = ({ config, onRestart, t }) => {
  const [showIdentity, setShowIdentity] = useState(false);
  const impostors = config.players.filter(p => p.isImpostor);

  const handleReveal = () => {
    // Using unified sound for consistency across the entire app
    playSound.revealSecret();
    setShowIdentity(true);
  };

  const handleRestart = () => {
    playSound.tap();
    onRestart();
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-in zoom-in duration-300">
      <div className="text-center mt-8">
        <h2 className="text-5xl font-black mb-2 italic">{t.revealTitle}</h2>
        <p className="text-slate-400">{t.momentTruth}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-8">
        {!showIdentity ? (
          <button
            onClick={handleReveal}
            className="w-full aspect-square max-h-[300px] bg-indigo-600 rounded-full flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/20 animate-pulse active:scale-95 transition-transform"
          >
            <span className="text-7xl mb-2">😈</span>
            <span className="text-2xl font-black uppercase tracking-widest">{t.tapToReveal}</span>
          </button>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-red-600/20 border-2 border-red-500 p-8 rounded-[2rem] text-center shadow-xl">
              <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4">
                {impostors.length > 1 ? t.theImpostorsWere : t.theImpostorWas}
              </h3>
              <div className="space-y-4">
                {impostors.map(p => (
                  <div key={p.id} className="text-5xl font-black text-white">
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-600/20 border-2 border-emerald-500 p-8 rounded-[2rem] text-center shadow-xl">
              <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-4">
                {t.secretWordLabel}
              </h3>
              <div className="text-5xl font-black text-white">
                {config.secretWord}
              </div>
              <p className="mt-2 text-emerald-300 font-medium">{t.categoryLabel.replace('{cat}', config.category)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="pb-4 safe-bottom">
        <button
          onClick={handleRestart}
          className="w-full bg-slate-100 text-slate-900 py-6 rounded-2xl text-2xl font-black active:scale-95 transition-all shadow-xl"
        >
          {t.playAgain}
        </button>
      </div>
    </div>
  );
};

export default ResultPhase;
