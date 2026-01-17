
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

// Component for online lobby
const OnlineLobby: React.FC<{
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStart: () => void;
  onBack: () => void;
  t: any;
}> = ({ roomId, players, isHost, onStart, onBack, t }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    playSound.tap();
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 font-bold text-xs uppercase tracking-widest">← {t.back}</button>
        <h2 className="text-xl font-black uppercase">{t.onlineLobby || 'Online Lobby'}</h2>
        <div className="w-8"></div>
      </div>

      <div className="bg-indigo-600/10 border-2 border-indigo-500/30 p-6 rounded-[2rem] text-center space-y-2">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.roomCode || 'Room Code'}</p>
        <button onClick={copyToClipboard} className="text-5xl font-black text-white tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-4 w-full">
          {roomId}
          <span className="text-sm bg-indigo-500/20 p-2 rounded-lg">📋</span>
        </button>
      </div>

      <div className="flex-1 bg-slate-800/50 rounded-[2rem] p-6 border border-slate-700/50 flex flex-col">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{t.connectedPlayers || 'Connected Players'} ({players.length})</h3>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {players.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30 animate-in fade-in duration-300">
              <span className="font-bold">{p.name} {p.isHost && '👑'}</span>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase font-bold">Player {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 3}
          className="w-full bg-indigo-600 py-6 rounded-[2rem] text-2xl font-black shadow-xl disabled:opacity-50 transition-all active:scale-95"
        >
          {players.length < 3 ? 'Wait for Players...' : t.next}
        </button>
      ) : (
        <div className="text-center py-6 animate-pulse-soft">
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm">{t.waitingForHost || 'Waiting for host to start...'}</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>(GameScreen.HOME);
  const [players, setPlayers] = useState<string[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.LOCAL);
  
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

  useEffect(() => {
    if (screen !== GameScreen.HOME) playSound.transition();
  }, [screen]);

  // PeerJS Cleanup
  useEffect(() => {
    return () => {
      peer?.destroy();
    };
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
          const msg = data as SocketMessage;
          if (msg.type === 'JOIN') {
            setOnlinePlayers(prev => {
              const newList = [...prev, { id: msg.id, name: msg.name, isImpostor: false }];
              // Broadcast update to all
              connectionsRef.current.forEach(c => c.send({ type: 'LOBBY_UPDATE', players: newList }));
              return newList;
            });
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
        const msg = data as SocketMessage;
        if (msg.type === 'LOBBY_UPDATE') {
          setOnlinePlayers(msg.players);
        } else if (msg.type === 'START_GAME') {
          setGameConfig(msg.config);
          setScreen(msg.screen);
        } else if (msg.type === 'NEXT_PHASE') {
          setScreen(msg.screen);
        }
      });
    });
    setPeer(newPeer);
  };

  const startGame = useCallback((selectedCategoryId: string, impostorCount: number) => {
    const categoryObj = CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[0];
    const langData = categoryObj.translations[lang];
    const secretWord = langData.words[Math.floor(Math.random() * langData.words.length)];
    
    let playerObjects: Player[];
    if (gameMode === GameMode.LOCAL) {
      playerObjects = players.map((name, index) => ({
        id: `p-${index}-${Date.now()}`,
        name,
        isImpostor: false,
      }));
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

    const config = {
      players: playerObjects,
      secretWord,
      category: langData.name,
      impostorCount: finalImpostorCount,
    };

    setGameConfig(config);
    setScreen(GameScreen.REVEAL);

    if (gameMode === GameMode.ONLINE && isHost) {
      connectionsRef.current.forEach(conn => {
        conn.send({ type: 'START_GAME', config, screen: GameScreen.REVEAL });
      });
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
    connectionsRef.current = [];
  }, [peer]);

  const GlobalLanguageSwitcher = () => (
    <div className="flex justify-center items-center py-2 px-4 z-50">
      <div className="flex bg-slate-800/60 backdrop-blur-md p-1 rounded-full border border-slate-700/50 shadow-lg scale-90">
        {(['en', 'pt', 'es'] as Language[]).map(l => (
          <button
            key={l}
            onClick={() => { playSound.tap(); setLang(l); }}
            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter transition-all ${
              lang === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case GameScreen.HOME:
        return <HomeScreen 
          onStartLocal={() => { setGameMode(GameMode.LOCAL); setScreen(GameScreen.PLAYER_SETUP); }} 
          onStartOnline={() => { setGameMode(GameMode.ONLINE); setScreen(GameScreen.PLAYER_SETUP); }} 
          t={t} 
        />;
      case GameScreen.PLAYER_SETUP:
        return (
          <PlayerSetup 
            players={players} 
            setPlayers={setPlayers} 
            onNext={() => {
              if (gameMode === GameMode.ONLINE) {
                // We reuse PlayerSetup for the joiner's name
                setScreen(GameScreen.ONLINE_LOBBY);
              } else {
                setScreen(GameScreen.GAME_SETTINGS);
              }
            }}
            onHost={initHost}
            onJoin={(room, name) => initJoin(room, name)}
            onBack={() => setScreen(GameScreen.HOME)}
            gameMode={gameMode}
            t={t}
          />
        );
      case GameScreen.ONLINE_LOBBY:
        return <OnlineLobby 
          roomId={roomId} 
          players={onlinePlayers} 
          isHost={isHost} 
          onStart={() => setScreen(GameScreen.GAME_SETTINGS)}
          onBack={resetGame}
          t={t}
        />;
      case GameScreen.GAME_SETTINGS:
        return (
          <GameSettings 
            playerCount={gameMode === GameMode.LOCAL ? players.length : onlinePlayers.length}
            onStart={startGame}
            onBack={() => setScreen(gameMode === GameMode.LOCAL ? GameScreen.PLAYER_SETUP : GameScreen.ONLINE_LOBBY)}
            t={t}
            lang={lang}
          />
        );
      case GameScreen.REVEAL:
        if (!gameConfig) return null;
        return (
          <RevealPhase 
            config={gameConfig} 
            onFinish={() => nextPhase(GameScreen.DISCUSSION)} 
            t={t}
            isOnline={gameMode === GameMode.ONLINE}
            myId={peer?.id || 'host'}
          />
        );
      case GameScreen.DISCUSSION:
        return <DiscussionPhase onReveal={() => nextPhase(GameScreen.RESULT)} t={t} isHost={isHost || gameMode === GameMode.LOCAL} />;
      case GameScreen.RESULT:
        if (!gameConfig) return null;
        return <ResultPhase config={gameConfig} onRestart={resetGame} t={t} />;
      default:
        return <HomeScreen onStartLocal={() => setScreen(GameScreen.PLAYER_SETUP)} onStartOnline={() => {}} t={t} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 flex flex-col overflow-hidden selection:bg-indigo-500/30">
      <GlobalLanguageSwitcher />
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
};

export default App;
