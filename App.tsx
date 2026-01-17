
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameScreen, Player, GameConfig, Language, GameMode, SocketMessage } from './types';
import { CATEGORIES } from './constants';
import { UI_STRINGS } from './i18n';
import { playSound } from './utils/sounds';
import Peer, { DataConnection } from 'peerjs';

import HomeScreen from './components/HomeScreen';
import PlayerSetup from './components/PlayerSetup';
import GameSettings from './components/GameSettings';
import RevealPhase from './components/RevealPhase';
import DiscussionPhase from './components/DiscussionPhase';
import ResultPhase from './components/ResultPhase';

// UI Helpers
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = "", title }) => (
  <div className={`bg-[#0a1120]/80 border border-[#1e293b] rounded-xl overflow-hidden shadow-lg ${className}`}>
    {title && <div className="px-4 py-2 bg-[#0f172a] border-b border-[#1e293b] text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{title}</div>}
    <div className="p-4">{children}</div>
  </div>
);

const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>(GameScreen.HOME);
  const [players, setPlayers] = useState<string[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.LOCAL);
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([]);
  
  // Multiplayer State
  const [peer, setPeer] = useState<Peer | null>(null);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const connectionsRef = useRef<DataConnection[]>([]);
  
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('impostor_lang');
      return (saved as Language) || 'en';
    } catch { return 'en'; }
  });

  const t = UI_STRINGS[lang];

  useEffect(() => {
    localStorage.setItem('impostor_lang', lang);
  }, [lang]);

  // PeerJS Cleanup
  useEffect(() => {
    return () => { peer?.destroy(); };
  }, [peer]);

  const initHost = () => {
    playSound.tap();
    const newPeer = new Peer(Math.random().toString(36).substring(2, 6).toUpperCase());
    newPeer.on('open', (id) => {
      setRoomId(id);
      setIsHost(true);
      setGameMode(GameMode.ONLINE);
      setOnlinePlayers([{ id: 'host', name: 'Me (Host)', isImpostor: false, isHost: true }]);
      setScreen(GameScreen.ONLINE_LOBBY);
    });
    newPeer.on('connection', (conn) => {
      conn.on('open', () => {
        connectionsRef.current.push(conn);
        conn.on('data', (data: any) => {
          const msg = data as any;
          if (msg.type === 'JOIN') {
            setOnlinePlayers(prev => {
              const newList = [...prev, { id: msg.id, name: msg.name, isImpostor: false }];
              connectionsRef.current.forEach(c => c.send({ type: 'LOBBY_UPDATE', players: newList }));
              return newList;
            });
          } else if (msg.type === 'CHAT') {
            // Relay chat to all clients
            const newMsg = { sender: msg.sender, text: msg.text };
            setChatMessages(prev => [...prev, newMsg]);
            connectionsRef.current.forEach(c => c.send({ type: 'CHAT_UPDATE', messages: [newMsg] }));
          }
        });
      });
    });
    setPeer(newPeer);
  };

  const initJoin = (targetRoom: string, playerName: string) => {
    playSound.tap();
    const newPeer = new Peer();
    newPeer.on('open', (myId) => {
      const conn = newPeer.connect(targetRoom.toUpperCase());
      conn.on('open', () => {
        connectionsRef.current = [conn];
        conn.send({ type: 'JOIN', name: playerName, id: myId });
        setRoomId(targetRoom.toUpperCase());
        setIsHost(false);
        setGameMode(GameMode.ONLINE);
        setScreen(GameScreen.ONLINE_LOBBY);
      });
      conn.on('data', (data: any) => {
        const msg = data as any;
        if (msg.type === 'LOBBY_UPDATE') {
          setOnlinePlayers(msg.players);
        } else if (msg.type === 'START_GAME') {
          setGameConfig(msg.config);
          setScreen(msg.screen);
        } else if (msg.type === 'NEXT_PHASE') {
          setScreen(msg.screen);
        } else if (msg.type === 'CHAT_UPDATE') {
          setChatMessages(prev => [...prev, ...msg.messages]);
        }
      });
    });
    setPeer(newPeer);
  };

  const sendChatMessage = (text: string) => {
    const myName = gameMode === GameMode.LOCAL ? "Local" : (isHost ? "Me (Host)" : (onlinePlayers.find(p => p.id === peer?.id)?.name || "Me"));
    const newMsg = { sender: myName, text };
    
    if (isHost) {
      setChatMessages(prev => [...prev, newMsg]);
      connectionsRef.current.forEach(c => c.send({ type: 'CHAT_UPDATE', messages: [newMsg] }));
    } else {
      connectionsRef.current[0].send({ type: 'CHAT', sender: myName, text });
    }
  };

  const startGame = useCallback((selectedCategoryId: string, impostorCount: number) => {
    const categoryObj = CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[0];
    const langData = categoryObj.translations[lang];
    const secretWord = langData.words[Math.floor(Math.random() * langData.words.length)];
    
    let playerObjects: Player[];
    if (gameMode === GameMode.LOCAL) {
      playerObjects = players.map((name, index) => ({ id: `p-${index}-${Date.now()}`, name, isImpostor: false }));
    } else {
      playerObjects = [...onlinePlayers];
    }

    const indices = Array.from({ length: playerObjects.length }, (_, i) => i);
    const finalImpostorCount = Math.min(impostorCount, playerObjects.length - 1);
    
    for (let i = 0; i < finalImpostorCount; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      const playerIndex = indices.splice(randomIndex, 1)[0];
      playerObjects[playerIndex].isImpostor = true;
    }

    const config = { players: playerObjects, secretWord, category: langData.name, impostorCount: finalImpostorCount };
    setGameConfig(config);
    setScreen(GameScreen.REVEAL);

    if (gameMode === GameMode.ONLINE && isHost) {
      connectionsRef.current.forEach(conn => conn.send({ type: 'START_GAME', config, screen: GameScreen.REVEAL }));
    }
  }, [players, onlinePlayers, lang, gameMode, isHost]);

  const nextPhase = (nextScreen: GameScreen) => {
    setScreen(nextScreen);
    if (gameMode === GameMode.ONLINE && isHost) {
      connectionsRef.current.forEach(c => c.send({ type: 'NEXT_PHASE', screen: nextScreen }));
    }
  };

  const resetGame = useCallback(() => {
    setScreen(GameScreen.HOME);
    setGameConfig(null);
    peer?.destroy();
    setPeer(null);
    setChatMessages([]);
    connectionsRef.current = [];
  }, [peer]);

  // Main Layout Wrappers
  const isIngame = screen === GameScreen.REVEAL || screen === GameScreen.DISCUSSION || screen === GameScreen.RESULT || screen === GameScreen.ONLINE_LOBBY;

  const GlobalLanguageSwitcher = () => (
    <div className="flex bg-[#0f172a]/80 backdrop-blur-md p-1 rounded-full border border-slate-800 shadow-xl self-center">
      {(['en', 'pt', 'es'] as Language[]).map(l => (
        <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === l ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{l.toUpperCase()}</button>
      ))}
    </div>
  );

  const CrewManifest = () => {
    const list = gameMode === GameMode.LOCAL ? players.map(p => ({ name: p, id: p })) : onlinePlayers;
    return (
      <Card title="CREW MANIFEST" className="flex-1">
        <div className="grid grid-cols-2 gap-2">
          {list.map((p: any) => {
            const isMe = gameMode === GameMode.ONLINE && (p.id === 'host' ? isHost : p.id === peer?.id);
            return (
              <div key={p.id} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${isMe ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-900/50 border-slate-800'}`}>
                <div className="text-2xl">{p.isHost ? '👨‍🚀' : (p.isImpostor && screen === GameScreen.RESULT ? '😈' : '👤')}</div>
                <div className={`text-[10px] font-bold uppercase truncate w-full text-center ${isMe ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {p.name} {isMe && <span className="text-[8px] text-cyan-500/80">(You)</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const MissionStatus = () => {
    const myPlayer = gameConfig?.players.find(p => p.id === (peer?.id || 'host'));
    const isImpostor = myPlayer?.isImpostor;

    return (
      <Card title="MISSION STATUS" className="h-fit">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-500 uppercase">Phase</span>
            <span className="text-cyan-400 uppercase tracking-widest">{screen}</span>
          </div>
          {gameConfig && (
            <div className="p-3 bg-cyan-950/20 border border-cyan-900/50 rounded-lg">
              <h4 className="text-[10px] font-black text-cyan-500 uppercase mb-2">Your Knowledge</h4>
              <div className="text-xs font-bold text-slate-200">
                {screen === GameScreen.REVEAL ? "Identity hidden until reveal." : 
                 isImpostor ? (
                   <div>
                     <span className="text-red-400 font-black">WARNING:</span> You are the <span className="text-red-500">Impostor</span>. Blend in with the crew.
                   </div>
                 ) : (
                   <div>
                     <span className="text-slate-400">Location:</span> <span className="text-cyan-400 font-black">{gameConfig.secretWord}</span>
                   </div>
                 )
                }
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#050b18] text-slate-100 flex flex-col overflow-hidden font-mono selection:bg-cyan-500/30">
      <header className="flex justify-between items-center p-4 bg-[#0a1120] border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(8,145,178,0.5)]">🛰️</div>
          <h1 className="text-xl font-black italic tracking-tighter text-cyan-500">IMPOSTOR MISSION</h1>
        </div>
        <GlobalLanguageSwitcher />
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4 max-w-7xl mx-auto w-full">
        {isIngame && (
          <aside className="w-1/3 flex flex-col gap-4 hidden md:flex">
            <CrewManifest />
            <MissionStatus />
          </aside>
        )}

        <main className={`flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar rounded-xl ${!isIngame ? 'items-center justify-center' : ''}`}>
          {screen === GameScreen.HOME && <HomeScreen onStartLocal={() => { setGameMode(GameMode.LOCAL); setScreen(GameScreen.PLAYER_SETUP); }} onStartOnline={() => { setGameMode(GameMode.ONLINE); setScreen(GameScreen.PLAYER_SETUP); }} t={t} />}
          {screen === GameScreen.PLAYER_SETUP && <PlayerSetup players={players} setPlayers={setPlayers} onNext={() => setScreen(gameMode === GameMode.ONLINE ? GameScreen.ONLINE_LOBBY : GameScreen.GAME_SETTINGS)} onHost={initHost} onJoin={initJoin} gameMode={gameMode} t={t} onBack={resetGame} />}
          {screen === GameScreen.ONLINE_LOBBY && (
            <Card title={`SIGNAL ESTABLISHED: ${roomId}`} className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="text-center p-8 border-2 border-dashed border-cyan-900/50 rounded-3xl bg-cyan-950/10">
                  <h3 className="text-xs font-black text-cyan-500 mb-2 uppercase tracking-widest">Awaiting Connections...</h3>
                  <div className="text-5xl font-black tracking-[0.2em] text-white">{roomId}</div>
                </div>
                <div className="md:hidden"><CrewManifest /></div>
              </div>
              <div className="pt-6">
                {isHost ? (
                  <button onClick={() => setScreen(GameScreen.GAME_SETTINGS)} disabled={onlinePlayers.length < 3} className="w-full bg-cyan-600 py-6 rounded-2xl text-2xl font-black shadow-cyan-600/20 shadow-xl disabled:opacity-30">INITIATE MISSION</button>
                ) : (
                  <div className="text-center animate-pulse text-cyan-500 font-bold uppercase tracking-widest">Syncing with Host...</div>
                )}
              </div>
            </Card>
          )}
          {screen === GameScreen.GAME_SETTINGS && <GameSettings playerCount={gameMode === GameMode.LOCAL ? players.length : onlinePlayers.length} onStart={startGame} onBack={() => setScreen(gameMode === GameMode.LOCAL ? GameScreen.PLAYER_SETUP : GameScreen.ONLINE_LOBBY)} t={t} lang={lang} />}
          {screen === GameScreen.REVEAL && <RevealPhase config={gameConfig!} onFinish={() => nextPhase(GameScreen.DISCUSSION)} t={t} isOnline={gameMode === GameMode.ONLINE} myId={peer?.id || 'host'} />}
          {screen === GameScreen.DISCUSSION && (
             <div className="flex-1 flex flex-col gap-4">
               <DiscussionPhase onReveal={() => nextPhase(GameScreen.RESULT)} t={t} isHost={isHost || gameMode === GameMode.LOCAL} />
               <Card title="COMMUNICATIONS LOG" className="flex-1 min-h-[300px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar pr-2">
                    {chatMessages.map((m, i) => (
                      <div key={i} className="text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
                        <span className="text-cyan-500 font-bold mr-2">[{m.sender}]:</span>
                        <span className="text-slate-300">{m.text}</span>
                      </div>
                    ))}
                    {chatMessages.length === 0 && <div className="text-center text-slate-700 italic py-10">No signals received yet...</div>}
                  </div>
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const target = e.target as any; if(target.msg.value.trim()){ sendChatMessage(target.msg.value); target.msg.value = ''; } }}>
                    <input name="msg" type="text" placeholder="Type your signal..." className="flex-1 bg-[#050b18] border border-slate-800 rounded-lg px-4 py-3 outline-none focus:border-cyan-500 text-sm font-bold" />
                    <button type="submit" className="bg-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center shadow-lg active:scale-95">➤</button>
                  </form>
               </Card>
             </div>
          )}
          {screen === GameScreen.RESULT && <ResultPhase config={gameConfig!} onRestart={resetGame} t={t} />}
        </main>
      </div>

      <footer className="p-2 text-center text-[8px] text-slate-700 font-black tracking-[0.4em] uppercase">
        System Active // Signal Strength Optimal // Mission Round {gameConfig ? '1 / 1' : '0 / 1'}
      </footer>
    </div>
  );
};

export default App;
