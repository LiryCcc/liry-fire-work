import type { EngineStatus, FireworksSettings } from './fireworks/settings.js';

export const STORAGE_KEY = 'liry-fireworks-settings';
export const MS_PER_SECOND = 1000;
export const TAU = Math.PI * 2;
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const HDR_QUERY = '(dynamic-range: high)';
export const TOUCH_QUERY = '(pointer: coarse)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const RENDERER_QUERY_KEY = 'renderer';
export const WEBGL_QUERY_VALUE = 'webgl';

export const DEFAULT_SETTINGS: FireworksSettings = {
  batchCount: { min: 8, max: 12 },
  clickCount: { min: 3, max: 5 },
  clickRadius: { min: 80, max: 120 },
  interval: { min: 1.5, max: 2.5 },
  bloom: 0.75,
  brightness: 1,
  quality: 'auto',
  patterns: ['mixed'],
  palettes: ['festival'],
  renderer: 'auto',
  hdr: true,
  sound: true,
  speech: false,
  volume: 0.55
};
export const INITIAL_STATUS: EngineStatus = {
  ready: false,
  backend: '',
  hdr: false,
  hdrAvailable: false,
  floatBuffer: true,
  fps: 0,
  active: 0,
  launched: 0,
  error: ''
};
export const SETTING_BOUNDS = {
  batchCount: { min: 1, max: 2000, step: 1, suffix: '朵' },
  clickCount: { min: 1, max: 200, step: 1, suffix: '朵' },
  clickRadius: { min: 7, max: 1800, step: 1, suffix: 'px' },
  interval: { min: 0.33, max: 50, step: 0.01, suffix: 's' },
  bloom: { min: 0, max: 15, step: 0.05, suffix: '' },
  brightness: { min: 0.1, max: 20, step: 0.1, suffix: '' },
  volume: { min: 0, max: 1, step: 0.01, suffix: '' }
} as const;
export const RANGE_SETTING_KEYS = ['batchCount', 'clickCount', 'clickRadius', 'interval'] as const;
export const QUALITY_OPTIONS = ['auto', 'low', 'high'] as const;
export const RENDERER_OPTIONS = [
  { id: 'auto', name: '自动选择' },
  { id: 'webgpu', name: 'WebGPU' },
  { id: 'webgl', name: 'WebGL 2' }
] as const;
export const PATTERN_OPTIONS = [
  { id: 'mixed', name: '随机' },
  { id: 'sphere', name: '星球' },
  { id: 'ring', name: '光环' },
  { id: 'willow', name: '垂柳' },
  { id: 'heart', name: '爱心' },
  { id: 'star', name: '星芒' },
  { id: 'chrysanthemum', name: '金菊' },
  { id: 'peony', name: '牡丹' },
  { id: 'palm', name: '棕榈' },
  { id: 'spiral', name: '螺旋' },
  { id: 'saturn', name: '土星' },
  { id: 'butterfly', name: '蝴蝶' },
  { id: 'crossette', name: '十字' },
  { id: 'waterfall', name: '瀑布' },
  { id: 'flower', name: '繁花' },
  { id: 'galaxy', name: '星河' }
] as const;
export const PALETTE_OPTIONS = [
  { id: 'festival', name: '缤纷', colors: ['#ffbf69', '#ff647c', '#80cfff', '#c4a1ff', '#8fffe0'] },
  { id: 'gold', name: '鎏金', colors: ['#ffe1a0', '#ffc56e', '#fff0d2'] },
  { id: 'aurora', name: '极光', colors: ['#58f4cc', '#73baff', '#a992ff'] },
  { id: 'rose', name: '绯色', colors: ['#ff85b2', '#ffb9d8', '#e5a4ff'] },
  { id: 'ocean', name: '深海', colors: ['#36bcff', '#74f1ff', '#737dff'] },
  { id: 'ember', name: '流火', colors: ['#ff603d', '#ffb141', '#ffe3a1'] },
  { id: 'lavender', name: '紫梦', colors: ['#aa78ff', '#d3a7ff', '#f7c9ff'] },
  { id: 'neon', name: '霓虹', colors: ['#ff42bb', '#42fff0', '#b6ff39'] },
  { id: 'ice', name: '冰晶', colors: ['#bdefff', '#eefbff', '#87baff'] },
  { id: 'sunset', name: '日落', colors: ['#ff9878', '#ffcc8f', '#cb87dd'] },
  { id: 'forest', name: '森语', colors: ['#73ffa9', '#c0f56a', '#4fdfb5'] },
  { id: 'pearl', name: '珍珠', colors: ['#fff1dc', '#d4e5ff', '#ffd9ef'] }
] as const;
export const SCHEDULER = {
  batchWindow: 0.95,
  maxPending: 24000,
  maxShells: 40000,
  resumeDelay: 0.5,
  targetXMin: 0.14,
  targetXRange: 0.72,
  targetYMin: 0.2,
  targetYRange: 0.38,
  sampleAttempts: 100
} as const;
export const SCENE = {
  worldHeight: 1000,
  near: -2000,
  far: 2000,
  cameraZ: 1000,
  background: '#030610',
  starColor: '#8198c1',
  starCount: 420,
  starZ: [-800, -400],
  starSize: 1,
  starOpacity: 0.26,
  bloomRadius: 0.35,
  bloomThreshold: 0.7
} as const;
export const PERFORMANCE = {
  touchCapacity: 131072,
  desktopCapacity: 262144,
  dprLow: 1,
  dprHigh: 2,
  dprTouch: 1.25,
  dprDesktop: 1.75,
  dprMin: 0.65,
  maxDelta: 0.06,
  initialFrameMs: 16.7,
  frameSmoothing: 0.04,
  reportInterval: 700,
  fpsMax: 240,
  warmupFrames: 180,
  adaptationInterval: 4000,
  slowFrameMs: 25,
  minScale: 0.55,
  scaleStep: 0.85,
  lowDetail: 0.6,
  highDetail: 1,
  particleBudgetFraction: 0.65,
  detailedRocketLimit: 160,
  lowDensityTrails: 1
} as const;
export const ROCKET = {
  horizontalDrift: [-55, 55],
  originY: -20,
  ascent: [0.65, 1.05],
  gravity: -170,
  headColor: [5, 3.2, 1.4],
  headSize: 7,
  drag: 0.001,
  trailStepLow: 0.025,
  trailStepHigh: 0.013,
  trailDrift: [-3, 3],
  trailVelocityY: -12,
  trailColor: [3.4, 1.8, 0.7],
  trailLife: 0.35,
  trailSize: [2, 4],
  trailGravity: -25,
  trailOpacity: 0.6
} as const;
export const EXPLOSION = {
  patterns: PATTERN_OPTIONS.map(({ id }) => id).filter((id) => id !== 'mixed'),
  shellLife: 4.2,
  energy: 4,
  trailLow: 3,
  trailHigh: 5,
  minStars: 3,
  stars: 145,
  reservedSlots: 2,
  speed: [90, 175],
  ringRotation: [-0.7, 0.7],
  willowLife: [2.6, 4],
  normalLife: [1.5, 2.8],
  goldEvery: 9,
  goldColor: [4.5, 3.8, 2.4],
  starSize: [3.5, 5.5],
  trailSize: 2.4,
  willowGravity: -65,
  normalGravity: -48,
  willowDrag: 0.95,
  normalDrag: 1.25,
  willowDelay: 0.045,
  normalDelay: 0.025,
  trailOpacity: 0.55,
  flashColor: [6, 4.8, 3],
  flashLife: 0.22,
  flashSize: 70,
  flashOpacity: 0.8
} as const;
export const PARTICLE_SHADER = {
  minLife: 0.001,
  minDrag: 0.001,
  sizeDecay: 0.65,
  coreFalloff: -32,
  coreEnergy: 1.6,
  coreRadius: 0.05,
  outerRadius: 0.5,
  fadePower: 1.4,
  trailFalloff: -8,
  alphaCutoff: 0.005,
  defaultGravity: -70,
  defaultDrag: 0.8
} as const;
export const INTERACTION = { dragThreshold: 12, markerDuration: 900, toastDuration: 2400 } as const;
export const BREAKPOINT = {
  mobile: 639,
  tablet: 1023,
  compactDesktop: 1200,
  wide: 1700,
  short: 550,
  landscape: 500,
  minLandscapeWidth: 640
} as const;
export const SLIDER_DEFAULTS = {
  value: 0,
  min: 0,
  max: 100,
  step: 1,
  suffix: '',
  fineStep: 0.1,
  fineDecimals: 2,
  decimals: 1
} as const;

export const SKY = {
  base: [0.003, 0.005, 0.014],
  nebula: [0.009, 0.008, 0.025],
  aurora: [0.003, 0.014, 0.018],
  drift: 0.035,
  frequencyX: 3.2,
  frequencyY: 4.5,
  detailFrequency: 8,
  secondaryDrift: 0.6,
  twinkleSpeed: 1.2,
  twinkleBase: 0.25,
  twinkleAmount: 0.4,
  starDrift: 0.008,
  planeZ: -950,
  meteorZ: -300,
  meteorPeriod: 13,
  meteorDuration: 1.4,
  meteorWidth: 120,
  meteorHeight: 1.4,
  meteorColor: '#aacdff',
  meteorStartX: 0.85,
  meteorStartY: 0.88,
  meteorTravelX: 0.42,
  meteorTravelY: 0.32,
  meteorAngle: -0.5,
  reducedMotionScale: 0.15
} as const;
export const SHAPE = {
  heartX: 16,
  heartY: [13, -5, -2, -1],
  heartScale: 17,
  starPoints: 5,
  starInnerRadius: 0.43,
  flowerPetals: 6,
  flowerBase: 0.65,
  flowerAmplitude: 0.35,
  chrysanthemumRays: 18,
  chrysanthemumLayers: 4,
  peonyInner: 0.55,
  palmBranches: 7,
  palmSpread: 0.3,
  spiralTurns: 3,
  spiralArms: 2,
  saturnInner: 0.45,
  saturnRing: 1.25,
  saturnTilt: 0.35,
  butterflyScale: 3,
  crossetteArms: 4,
  crossetteSpread: 0.16,
  waterfallWidth: 0.38,
  waterfallHeight: 0.3,
  galaxyArms: 3,
  galaxyTurns: 2
} as const;

export const SKY_DISTRIBUTION = {
  focusWeight: 0.24,
  goldenLow: (3 - Math.sqrt(5)) / 2,
  goldenHigh: (Math.sqrt(5) - 1) / 2,
  focusSigma: 0.12,
  sequenceX: 0.7548776662466927,
  sequenceY: 0.5698402909980532,
  sampleAttempts: 32,
  logarithmEpsilon: 0.000001,
  goldenPoints: 4
} as const;

export const AUTOMATIC_FOCUS = {
  ratio: 0.3,
  pointCount: 3,
  refreshBatches: 9,
  sigma: 0.075,
  sampleAttempts: 32
} as const;
export const DRAWER_QUERY = `(max-width: ${BREAKPOINT.tablet}px), (max-height: ${BREAKPOINT.short}px)`;

export const ICON_PATHS = {
  spark:
    'M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2Z',
  settings: 'M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6',
  close: 'm6 6 12 12M6 18 18 6',
  play: 'm8 5 11 7-11 7Z',
  pause: 'M8 5v14M16 5v14',
  clear: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  pointer: 'm5 3 14 10-7 1-3 7Z',
  check: 'm5 12 4 4L19 6',
  sound: 'M11 5 6 9H3v6h3l5 4Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'M11 5 6 9H3v6h3l5 4Zm5 4 5 6m0-6-5 6'
} as const;

export const SHAPE_COMPOSITION = { randomMin: 1, randomMax: 3, layerSpeedMin: 0.85, layerSpeedMax: 1.2 } as const;
export const COLOR_RANDOM = {
  hue: 0.045,
  saturation: 0.07,
  lightness: 0.025,
  mixChance: 0.45,
  goldChance: 0.07,
  energy: [0.75, 1.35]
} as const;
export const AUDIO = {
  processorName: 'liry-fireworks-audio',
  minLaunchGap: 0.065,
  minExplosionGap: 0.045,
  gainRamp: 0.06,
  volume: { min: 0, max: 1 },
  speechCooldown: 9000,
  autoSpeechInterval: 24000,
  speechLanguage: 'zh-CN',
  speechRate: [0.88, 1.04],
  speechPitch: [0.92, 1.08],
  phrases: [
    '把今夜点亮。',
    '愿每一束光，都带来一点美好。',
    '这一场烟花，送给此刻的你。',
    '抬头看，新的惊喜正在绽放。',
    '星光与烟花，都在这一刻相遇。'
  ],
  processor: {
    maxVoices: 24,
    masterGain: 0.18,
    echoSeconds: 0.45,
    echoLeft: 0.16,
    echoRight: 0.23,
    echoMix: 0.16,
    echoFeedback: 0.13,
    attack: 0.004,
    launchLife: [0.35, 0.85],
    explosionLife: [0.65, 1.7],
    launchPitch: [420, 1100],
    launchSweep: [900, 2400],
    explosionPitch: [38, 120],
    decay: [3.8, 7],
    filter: [0.012, 0.09],
    crackleChance: [0.001, 0.006],
    crackleDecay: 0.72,
    crackleGain: 0.24,
    pitchDrop: 7,
    lowGain: 0.6,
    noiseGain: 0.85,
    whistleGain: 0.12,
    launchNoise: 0.35,
    launchTone: 0.08,
    panJitter: 0.16,
    gainJitter: [0.65, 1.1],
    secondaryPitch: 1.47,
    secondaryGain: 0.16,
    feedbackMeterBlocks: 64
  }
} as const;
