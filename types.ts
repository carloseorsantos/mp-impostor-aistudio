
export enum GameScreen {
  HOME = 'HOME',
  MODE_SELECT = 'MODE_SELECT',
  PLAYER_SETUP = 'PLAYER_SETUP',
  ONLINE_LOBBY = 'ONLINE_LOBBY',
  GAME_SETTINGS = 'GAME_SETTINGS',
  REVEAL = 'REVEAL',
  DISCUSSION = 'DISCUSSION',
  RESULT = 'RESULT'
}

export type Language = 'en' | 'pt' | 'es';

export enum GameMode {
  LOCAL = 'LOCAL',
  ONLINE = 'ONLINE'
}

export interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  isHost?: boolean;
}

export interface Category {
  id: string;
  icon: string;
  translations: {
    [key in Language]: {
      name: string;
      words: string[];
    };
  };
}

export interface GameConfig {
  players: Player[];
  secretWord: string;
  category: string;
  impostorCount: number;
}

export type SocketMessage = 
  | { type: 'JOIN'; name: string; id: string }
  | { type: 'LOBBY_UPDATE'; players: Player[] }
  | { type: 'START_GAME'; config: GameConfig; screen: GameScreen }
  | { type: 'NEXT_PHASE'; screen: GameScreen }
  | { type: 'SYNC_REVEAL'; playerIndex: number };
