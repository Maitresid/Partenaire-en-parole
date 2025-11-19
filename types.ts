export enum ProficiencyLevel {
  A1 = 'A1',
  A2 = 'A2',
}

export enum InteractionMode {
  TEXT = 'Text',
  SPEECH = 'Speech',
}

export interface AppConfig {
  level: ProficiencyLevel;
  words: string[];
  topic: string;
  mode: InteractionMode;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AudioState {
  isConnected: boolean;
  isRecording: boolean;
  volume: number; // For visualizer
}
