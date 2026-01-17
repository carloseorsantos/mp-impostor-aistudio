
import React, { useState } from 'react';
import { GameConfig } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { playSound } from '../utils/sounds';

interface Props {
  config: GameConfig;
  onFinish: () => void;
  t: any;
  isOnline?: boolean;
  myId?: string;
}

const RevealPhase: React.FC<Props> = ({ config, onFinish, t, isOnline, myId }) => {
  const [localIndex, setLocalIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [decoyTips, setDecoyTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  const currentPlayer = isOnline 
    ? config.players.find(p => p.id === myId || (p.isHost && myId === 'host')) || config.players[0]
    : config.players[localIndex];

  const handleReveal = () => {
    playSound.revealSecret();
    setIsRevealing(true);
  };

  const fetchDecoyTips = async () => {
    playSound.tap();
    setIsLoadingTips(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The game is 'Impostor'. The category is '${config.category}'. The secret word is '${config.secretWord}'. Generate 3 different decoy words that belong to this category but are NOT the secret word. Use the language of the category provided. Generate response in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decoys: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              }
            },
            required: ["decoys"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      if (data.decoys) setDecoyTips(data.decoys);
    } catch (e) { console.error(e); } finally { setIsLoadingTips(false); }
  };

  const handleNext = () => {
    playSound.tap();
    if (isOnline) {
      onFinish();
    } else {
      setIsRevealing(false);
      setDecoyTips([]);
      if (localIndex < config.players.length - 1) {
        setLocalIndex(prev => prev + 1);
      } else {
        onFinish();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0a1120] border border-cyan-900/30 rounded-2xl animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h3 className="text-cyan-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">
          {isOnline ? 'Personal Data Reveal' : `Decrypting Identity: ${localIndex + 1}/${config.players.length}`}
        </h3>
        <h2 className="text-4xl font-black text-white italic tracking-tighter">{currentPlayer.name}</h2>
      </div>

      {!isRevealing ? (
        <button 
          onClick={handleReveal} 
          className="w-full aspect-square max-w-[280px] bg-[#050b18] rounded-[2.5rem] border-2 border-dashed border-cyan-800/30 flex flex-col items-center justify-center gap-4 active:border-cyan-500 hover:bg-cyan-950/10 transition-all group"
        >
          <div className="text-8xl group-hover:scale-110 transition-transform">👁️</div>
          <div className="text-xs font-black text-cyan-600 uppercase tracking-widest">{t.tapToReveal}</div>
        </button>
      ) : (
        <div className="w-full max-w-[400px] space-y-6 animate-in zoom-in duration-500">
          <div className={`p-8 rounded-[2rem] text-center border-2 ${
            currentPlayer.isImpostor ? 'bg-red-950/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
          }`}>
            {currentPlayer.isImpostor ? (
              <>
                <div className="text-7xl mb-4">😈</div>
                <h4 className="text-red-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">{t.youAreImpostor}</h4>
                <div className="text-5xl font-black text-white mb-4 italic tracking-tighter">{t.impostor}</div>
                <p className="text-red-300/80 text-xs font-bold leading-relaxed">{t.blendIn.replace('{cat}', config.category)}</p>
                {decoyTips.length > 0 ? (
                  <div className="mt-6 p-4 bg-red-900/10 border border-red-800/30 rounded-xl space-y-2">
                    <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Interference Decoys</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {decoyTips.map((tip, i) => <span key={i} className="bg-red-900/30 px-3 py-1 rounded text-[10px] font-bold border border-red-800/50 text-white">{tip}</span>)}
                    </div>
                  </div>
                ) : (
                  <button onClick={fetchDecoyTips} disabled={isLoadingTips} className="mt-8 text-[10px] font-black bg-red-600 text-white px-6 py-3 rounded-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest">
                    {isLoadingTips ? t.thinkingDecoys : t.getDecoyWords}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="text-7xl mb-4">💎</div>
                <h4 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">{t.secretWordLabel}</h4>
                <div className="text-5xl font-black text-white mb-4 italic tracking-tighter">{config.secretWord}</div>
                <p className="text-cyan-300/80 text-xs font-bold">{t.categoryLabel.replace('{cat}', config.category)}</p>
              </>
            )}
          </div>
          <button 
            onClick={handleNext} 
            className="w-full bg-slate-100 text-[#050b18] py-5 rounded-xl text-xl font-black active:scale-95 transition-all shadow-xl uppercase tracking-tighter italic"
          >
            {isOnline ? 'SECURE DATA' : (localIndex === config.players.length - 1 ? t.confirmReveal : t.hideContinue)}
          </button>
        </div>
      )}
    </div>
  );
};

export default RevealPhase;
