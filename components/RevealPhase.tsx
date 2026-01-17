
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

  // In online mode, we only show the card matching our peer ID
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
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs">
          {isOnline ? 'Online Mode' : t.playerOf.replace('{n}', (localIndex + 1).toString()).replace('{total}', config.players.length.toString())}
        </h3>
        <h2 className="text-4xl font-black">{currentPlayer.name}</h2>
      </div>

      {!isRevealing ? (
        <button onClick={handleReveal} className="w-full aspect-square max-h-[320px] bg-slate-800 rounded-[3rem] border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-4 active:border-indigo-500 transition-colors">
          <span className="text-8xl">👁️</span>
          <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">{t.tapToReveal}</span>
        </button>
      ) : (
        <div className="w-full space-y-8 animate-in flip-in-y duration-500">
          <div className={`p-10 rounded-[2.5rem] text-center border-4 ${
            currentPlayer.isImpostor ? 'bg-red-600/20 border-red-500' : 'bg-indigo-600/20 border-indigo-500'
          }`}>
            {currentPlayer.isImpostor ? (
              <>
                <div className="text-7xl mb-4">😈</div>
                <h4 className="text-red-400 font-bold uppercase tracking-widest text-xs">{t.youAreImpostor}</h4>
                <div className="text-6xl font-black text-white mb-4">{t.impostor}</div>
                <p className="text-red-300 font-medium">{t.blendIn.replace('{cat}', config.category)}</p>
                {decoyTips.length > 0 ? (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {decoyTips.map((tip, i) => <span key={i} className="bg-red-500/30 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">{tip}</span>)}
                  </div>
                ) : (
                  <button onClick={fetchDecoyTips} disabled={isLoadingTips} className="mt-8 text-xs font-black bg-red-600 px-6 py-3 rounded-xl active:scale-95 disabled:opacity-50">
                    {isLoadingTips ? t.thinkingDecoys : t.getDecoyWords}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="text-7xl mb-4">💎</div>
                <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-xs">{t.secretWordLabel}</h4>
                <div className="text-6xl font-black text-white mb-4 tracking-tight">{config.secretWord}</div>
                <p className="text-indigo-300 font-medium">{t.categoryLabel.replace('{cat}', config.category)}</p>
              </>
            )}
          </div>
          <button onClick={handleNext} className="w-full bg-slate-100 text-slate-900 py-6 rounded-[2rem] text-2xl font-black active:scale-95 shadow-xl">
            {isOnline ? 'FINISH REVEAL' : (localIndex === config.players.length - 1 ? t.confirmReveal : t.hideContinue)}
          </button>
        </div>
      )}
    </div>
  );
};

export default RevealPhase;
