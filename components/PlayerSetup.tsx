
import React, { useState, useRef } from 'react';
import { MIN_PLAYERS, MAX_PLAYERS } from '../constants';
import { playSound } from '../utils/sounds';
import { GameMode } from '../types';

interface Props {
  players: string[];
  setPlayers: (players: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onHost: () => void;
  onJoin: (room: string, name: string) => void;
  gameMode: GameMode;
  t: any;
}

const PlayerSetup: React.FC<Props> = ({ players, setPlayers, onNext, onBack, onHost, onJoin, gameMode, t }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [roomToJoin, setRoomToJoin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < MAX_PLAYERS) {
      playSound.tap();
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
      inputRef.current?.focus();
    }
  };

  const handleJoin = () => {
    if (newPlayerName.trim() && roomToJoin.trim()) {
      onJoin(roomToJoin, newPlayerName);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white p-2 -ml-2 font-bold text-sm uppercase tracking-widest">← {t.back}</button>
        <h2 className="text-xl font-black uppercase tracking-tight">{t.players}</h2>
        <div className="w-8"></div>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-xl">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2 mb-2 block">{t.enterName}</label>
          <input
            ref={inputRef}
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder={t.enterName}
            className="w-full bg-slate-900 border-none rounded-2xl px-5 py-4 outline-none font-bold text-lg placeholder:text-slate-700 mb-4"
          />

          {gameMode === GameMode.ONLINE && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2 block">{t.joinRoom || 'Join Room'}</label>
              <input
                type="text"
                value={roomToJoin}
                onChange={(e) => setRoomToJoin(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="w-full bg-slate-900 border-none rounded-2xl px-5 py-4 outline-none font-bold text-lg text-center tracking-widest placeholder:text-slate-700"
              />
              <button
                onClick={handleJoin}
                disabled={!newPlayerName.trim() || !roomToJoin.trim()}
                className="w-full bg-emerald-600 py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-30 transition-all active:scale-95"
              >
                JOIN GAME
              </button>
              <div className="text-center py-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">OR</span>
              </div>
              <button
                onClick={() => { if(newPlayerName.trim()) onHost(); }}
                disabled={!newPlayerName.trim()}
                className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-30 transition-all active:scale-95"
              >
                HOST NEW GAME
              </button>
            </div>
          )}

          {gameMode === GameMode.LOCAL && (
            <button
              onClick={addPlayer}
              disabled={!newPlayerName.trim() || players.length >= MAX_PLAYERS}
              className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-30 transition-all active:scale-95"
            >
              {t.add}
            </button>
          )}
        </div>

        {gameMode === GameMode.LOCAL && (
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[300px]">
            {players.map((player, index) => (
              <div key={index} className="bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-700/50 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400">{index + 1}</span>
                  <span className="font-bold text-lg">{player}</span>
                </div>
                <button onClick={() => { playSound.tap(); setPlayers(players.filter((_, i) => i !== index)); }} className="text-slate-500 p-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 safe-bottom">
        {gameMode === GameMode.LOCAL && (
          <button
            onClick={() => { playSound.tap(); onNext(); }}
            disabled={players.length < MIN_PLAYERS}
            className={`w-full py-6 rounded-[2rem] text-2xl font-black transition-all shadow-xl active:scale-95 border-b-4 ${
              players.length < MIN_PLAYERS ? 'bg-slate-800 opacity-50' : 'bg-indigo-600 border-indigo-800'
            }`}
          >
            {players.length < MIN_PLAYERS ? t.addMore.replace('{n}', (MIN_PLAYERS - players.length).toString()) : t.next}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerSetup;
