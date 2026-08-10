export type GameState = 'LOADING' | 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type DifficultyMode = 'CASUAL' | 'PHYSICS' | 'HARDCORE';

export type VisualTheme = 'PASTEL' | 'NEON' | 'MONOCHROME' | 'SUNSET';

export interface BlockDimensions {
  width: number; // Size along X
  depth: number; // Size along Z
  height: number; // Fixed block height (e.g., 0.8)
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlacedBlock {
  id: number;
  position: Vector3D;
  dimensions: BlockDimensions;
  color: string;
  isPerfect: boolean;
}

export interface FallingDebris {
  id: number;
  position: Vector3D;
  dimensions: BlockDimensions;
  velocity: Vector3D;
  angularVelocity: Vector3D;
  color: string;
  createdAt: number;
}

export interface ComboFeedback {
  text: string;
  count: number;
  multiplier: number;
  timestamp: number;
}

export interface GameStats {
  score: number;
  heightMeters: number;
  perfectCount: number;
  maxCombo: number;
  accuracyPercent: number;
  totalBlocksDropped: number;
}

export interface ThemeColors {
  name: string;
  bgGradient: [string, string];
  fogColor: string;
  ambientLight: string;
  dirLight: string;
  basePedestal: string;
  getPaletteColor: (index: number) => string;
}
