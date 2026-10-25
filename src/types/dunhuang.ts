export interface CandidateTake {
  id: string;
  name: string;
  videoUrl: string;
  duration: number; // in seconds
  description: string;
  thumbUrl: string;
  isDefault: boolean;
}

export interface ShotAnnotation {
  index: string; // "01", "04", etc.
  title: string; // e.g. "仰見天心"
  prose: string; // poetic commentary, e.g. "抬頭，一枚古老的圖案旋急在藻井中央。"
  tags: string[]; // e.g. ["動態藻井", "三兔共心"]
}

export interface ShotInfo {
  id: string; // e.g. "S01", "S02", "S03", "S03B", "S04", "S04B", "S05", "S06", "S07B"
  shotNumber: number; // 1 to 9
  name: string;
  caveSection: string; // e.g. "外窟门廊", "内室前甬道", "藻井仰视", "壁画叙事空间"
  aestheticRatio: string; // e.g. "70% 洞窟现实 / 30% 壁画质感"
  aestheticRule: string;
  motionDescription: string;
  targetDuration: number;
  startFrameThumb: string;
  endFrameThumb: string;
  takes: CandidateTake[];
  selectedTakeId: string;
  promptStart: string;
  promptEnd: string;
  scenePrompt: string;
  keyContinuityFocus: string;
  annotation: ShotAnnotation;
}

export interface ContinuityTransition {
  id: string; // e.g. "S01_S02"
  fromShotId: string;
  toShotId: string;
  transitionName: string; // "S01 → S02"
  requiredElements: string; // "门内黑场、前进方向"
  checkPoints: string; // "不要突然变亮或改变轴线"
  status: 'passed' | 'review' | 'pending';
  notes: string;
  fromEndFrame: string;
  toStartFrame: string;
  continuityTips: string;
}

export interface MineralPigment {
  name: string;
  chineseName: string;
  englishMineral: string;
  hex: string;
  rgb: string;
  historicalSource: string;
  culturalMeaning: string;
  sceneApplication: string;
}

export interface CandlelightSettings {
  enabled: boolean;
  intensity: number; // 0.1 to 1.0
  radius: number; // 120 to 450 px
  flickerSpeed: 'still' | 'soft' | 'natural' | 'flickering';
  revealTexture: boolean; // Show ancient crack & pigment glint
  mode: 'cursor' | 'ambient' | 'dual' | 'spotlight';
  dustMotes: boolean;
  colorTemperature: 'warm_amber' | 'clay_gold' | 'tallow_white';
}
