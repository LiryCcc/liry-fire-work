import type { FireworkSound } from '@/audio/types.js';
import {
  COLOR_RANDOM,
  EXPLOSION,
  HDR_QUERY,
  MS_PER_SECOND,
  PALETTE_OPTIONS,
  PERFORMANCE,
  ROCKET,
  SCENE,
  SCHEDULER,
  SHAPE_COMPOSITION,
  TOUCH_QUERY
} from '@/constant.js';
import { pickRandom } from '@/utils/random.js';
import { ExtendedSRGBColorSpace, ExtendedSRGBColorSpaceImpl } from 'three/addons/math/ColorSpaces.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import {
  ACESFilmicToneMapping,
  Color,
  ColorManagement,
  HalfFloatType,
  NoToneMapping,
  OrthographicCamera,
  RenderPipeline,
  Scene,
  SRGBColorSpace,
  UnsignedByteType,
  WebGPURenderer
} from 'three/webgpu';
import { ParticleField } from './particles.js';
import { LaunchScheduler, pointerTargets, type Launch, type Target } from './scheduler.js';
import { INITIAL_STATUS, sampleRange, type EngineStatus, type FireworksSettings, type Mode } from './settings.js';
import { composePatterns, shapeVelocity } from './shapes.js';
import { DynamicSky } from './sky.js';

interface Shell {
  at: number;
  target: [number, number, number];
  settings: FireworksSettings;
  done: boolean;
  end: number;
}
const random = (min: number, max: number) => min + Math.random() * (max - min);

export class FireworksEngine {
  readonly scheduler = new LaunchScheduler();
  #renderer: WebGPURenderer | undefined;
  #pipeline: RenderPipeline | undefined;
  #scenePass: ReturnType<typeof pass> | undefined;
  #bloomPass: ReturnType<typeof bloom> | undefined;
  readonly #scene = new Scene();
  readonly #camera = new OrthographicCamera(0, SCENE.worldHeight, SCENE.worldHeight, 0, SCENE.near, SCENE.far);
  readonly #field: ParticleField;
  readonly #sky: DynamicSky;
  readonly #media = matchMedia(HDR_QUERY);
  readonly #coarse = matchMedia(TOUCH_QUERY).matches;
  #shells: Shell[] = [];
  #settings: FireworksSettings;
  #status = { ...INITIAL_STATUS };
  #paused = false;
  #disposed = false;
  #time = 0;
  #last = 0;
  #lastDelta = 0;
  #lastReport = 0;
  #frames = 0;
  #frameDuration: number = PERFORMANCE.initialFrameMs;
  #scale = 1;
  #lastScaleChange = 0;
  #width = 1;
  #height = 1;
  #observer: ResizeObserver | undefined;
  #report: (status: EngineStatus) => void;
  #displayChanged: () => void;
  #sound: (sound: FireworkSound) => void;

  constructor(
    settings: FireworksSettings,
    report: (status: EngineStatus) => void,
    displayChanged: () => void,
    sound: (sound: FireworkSound) => void = () => {}
  ) {
    this.#settings = { ...settings };
    this.#report = report;
    this.#displayChanged = displayChanged;
    this.#sound = sound;
    this.#field = new ParticleField(this.#coarse ? PERFORMANCE.touchCapacity : PERFORMANCE.desktopCapacity);
    this.#scene.add(this.#field.mesh);
    this.#scene.background = new Color(SCENE.background);
    this.#sky = new DynamicSky(this.#scene);
    this.#camera.position.z = SCENE.cameraZ;
  }

  async init(host: HTMLElement): Promise<void> {
    ColorManagement.define({ [ExtendedSRGBColorSpace]: ExtendedSRGBColorSpaceImpl });
    const forceWebGL = this.#settings.renderer === 'webgl';
    let hdr = this.#settings.hdr && this.#media.matches && !forceWebGL && 'gpu' in navigator;
    let renderer: WebGPURenderer;
    try {
      renderer = await this.#createRenderer(forceWebGL, hdr, true);
    } catch (error) {
      if (!hdr) {
        throw error;
      }
      hdr = false;
      renderer = await this.#createRenderer(forceWebGL, false, true);
    }
    if (this.#disposed) {
      await renderer.dispose();
      return;
    }
    let context = this.#getContext(renderer);
    const gpu = 'configure' in context;
    if (!gpu && this.#settings.renderer === 'webgpu') {
      await renderer.dispose();
      throw new Error('当前浏览器无法使用 WebGPU，请选择自动或 WebGL 2。');
    }
    if (!gpu && hdr) {
      await renderer.dispose();
      hdr = false;
      renderer = await this.#createRenderer(true, false, true);
      context = this.#getContext(renderer);
    }
    let floats = true;
    if (!('configure' in context) && !context.getExtension('EXT_color_buffer_float')) {
      await renderer.dispose();
      floats = false;
      renderer = await this.#createRenderer(true, false, false);
    }
    if (this.#disposed) {
      await renderer.dispose();
      return;
    }
    this.#renderer = renderer;
    renderer.outputColorSpace = hdr ? ExtendedSRGBColorSpace : SRGBColorSpace;
    renderer.toneMapping = hdr ? NoToneMapping : ACESFilmicToneMapping;
    renderer.onDeviceLost = () => this.#fail('图形设备已断开，请重新连接画布。');
    renderer.onError = () => this.#fail('图形渲染遇到问题，请重试或切换 WebGL。');
    const canvas = renderer.domElement;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('天幕需要可见的 HTML Canvas。');
    }
    canvas.setAttribute('aria-label', '烟花夜空，点击任意位置燃放烟花');
    canvas.setAttribute('role', 'img');
    host.replaceChildren(canvas);
    this.#scenePass = pass(this.#scene, this.#camera, { type: floats ? HalfFloatType : UnsignedByteType });
    this.#pipeline = new RenderPipeline(renderer);
    const color = this.#scenePass.getTextureNode('output');
    if (floats) {
      this.#bloomPass = bloom(color, this.#settings.bloom, SCENE.bloomRadius, SCENE.bloomThreshold);
      this.#pipeline.outputNode = color.add(this.#bloomPass);
    } else {
      this.#pipeline.outputNode = color;
    }
    this.#status = {
      ...this.#status,
      ready: true,
      backend: gpu ? 'WebGPU' : 'WebGL 2',
      hdr,
      hdrAvailable: gpu && this.#media.matches,
      floatBuffer: floats
    };
    this.setSettings(this.#settings);
    this.#observer = new ResizeObserver(() => this.#resize(host));
    this.#observer.observe(host);
    this.#resize(host);
    document.addEventListener('visibilitychange', this.#onVisibility);
    this.#media.addEventListener('change', this.#displayChanged);
    this.#report({ ...this.#status });
    renderer.setAnimationLoop(this.#animate);
  }

  #getContext(renderer: WebGPURenderer): GPUCanvasContext | WebGL2RenderingContext {
    const context = renderer.getContext();
    if (typeof GPUCanvasContext !== 'undefined' && context instanceof GPUCanvasContext) {
      return context;
    }
    if (typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext) {
      return context;
    }
    throw new Error('图形上下文不可用，请重新连接天幕。');
  }

  async #createRenderer(forceWebGL: boolean, hdr: boolean, floats: boolean): Promise<WebGPURenderer> {
    const renderer = new WebGPURenderer({
      alpha: false,
      antialias: false,
      forceWebGL,
      outputType: hdr ? HalfFloatType : UnsignedByteType,
      outputBufferType: floats ? HalfFloatType : UnsignedByteType
    });
    try {
      await renderer.init();
      return renderer;
    } catch (error) {
      try {
        await renderer.dispose();
      } catch {
        /* Initialization may be incomplete. */
      }
      throw error;
    }
  }

  setSettings(settings: FireworksSettings): void {
    const qualityChanged = this.#settings.quality !== settings.quality;
    this.#settings = { ...settings };
    this.#field.energy.value = settings.brightness;
    if (this.#bloomPass) {
      this.#bloomPass.strength.value = settings.bloom;
    }
    if (qualityChanged) {
      this.#scale = 1;
    }
    this.#updatePixelRatio();
  }

  setMode(mode: Mode): void {
    this.scheduler.setMode(mode, this.#time);
  }
  setPaused(paused: boolean): void {
    this.#paused = paused;
    this.#last = 0;
    this.#status.active = this.#shells.length;
    this.#report({ ...this.#status });
  }

  launch(): boolean {
    if (!this.#status.ready || this.#paused || !this.#canSchedule(this.#settings.batchCount.max)) {
      return false;
    }
    return this.scheduler.batch(this.#time, this.#settings);
  }

  pointer(center: Target, rect: DOMRect): boolean {
    if (!this.#status.ready || this.#paused || !this.#canSchedule(this.#settings.clickCount.max)) {
      return false;
    }
    return this.scheduler.batch(
      this.#time,
      this.#settings,
      'pointer',
      pointerTargets(
        center,
        sampleRange(this.#settings.clickRadius),
        rect.width,
        rect.height,
        sampleRange(this.#settings.clickCount, true)
      )
    );
  }

  clear(): void {
    this.scheduler.clear(this.#time);
    this.#shells = [];
    this.#field.clear();
    this.#status.active = 0;
    this.#report({ ...this.#status });
  }

  #canSchedule(count: number): boolean {
    return this.#shells.length + this.scheduler.pending + count <= SCHEDULER.maxShells;
  }

  #resize(host: HTMLElement): void {
    const bounds = host.getBoundingClientRect();
    this.#width = Math.max(1, bounds.width);
    this.#height = Math.max(1, bounds.height);
    const worldWidth = (this.#width / this.#height) * SCENE.worldHeight;
    this.#camera.right = worldWidth;
    this.#camera.updateProjectionMatrix();
    this.#sky.resize(worldWidth);
    this.scheduler.setAspect(this.#width / this.#height);
    this.#renderer?.setSize(this.#width, this.#height, false);
    this.#updatePixelRatio();
  }

  #updatePixelRatio(): void {
    const cap =
      this.#settings.quality === 'low'
        ? PERFORMANCE.dprLow
        : this.#settings.quality === 'high'
          ? PERFORMANCE.dprHigh
          : this.#coarse
            ? PERFORMANCE.dprTouch
            : PERFORMANCE.dprDesktop;
    this.#renderer?.setPixelRatio(Math.max(PERFORMANCE.dprMin, Math.min(devicePixelRatio || 1, cap) * this.#scale));
  }

  readonly #onVisibility = (): void => {
    this.#last = 0;
    if (document.hidden) {
      this.scheduler.clear(this.#time);
      this.#renderer?.setAnimationLoop(null);
    } else if (!this.#disposed && this.#status.ready) {
      this.#renderer?.setAnimationLoop(this.#animate);
    }
  };

  readonly #animate = (timestamp: number): void => {
    if (this.#disposed || !this.#pipeline || document.hidden || !this.#status.ready) {
      return;
    }
    const delta = this.#last ? Math.min((timestamp - this.#last) / MS_PER_SECOND, PERFORMANCE.maxDelta) : 0;
    this.#lastDelta = this.#last ? (timestamp - this.#last) / MS_PER_SECOND : 0;
    this.#last = timestamp;
    if (!this.#paused) {
      this.#time += this.#lastDelta;
      this.#sky.update(this.#time);
      this.#field.active(this.#time);
      // Auto scheduling uses the same capacity guard as the buttons.
      this.scheduler.update(
        this.#time,
        this.#settings,
        (launch) => this.#spawn(launch),
        this.#canSchedule(this.#settings.batchCount.max)
      );
      for (const shell of this.#shells) {
        if (!shell.done && this.#time >= shell.at) {
          this.#explode(shell);
          shell.done = true;
        }
      }
      this.#shells = this.#shells.filter((shell) => shell.end > this.#time);
      this.#field.update(this.#time);
    }
    try {
      this.#pipeline.render();
    } catch {
      this.#fail('当前设备无法完成渲染，请尝试 WebGL 模式。');
      return;
    }
    this.#frames++;
    if (delta > 0) {
      this.#frameDuration =
        this.#frameDuration * (1 - PERFORMANCE.frameSmoothing) + delta * MS_PER_SECOND * PERFORMANCE.frameSmoothing;
    }
    if (timestamp - this.#lastReport >= PERFORMANCE.reportInterval) {
      this.#status.fps = Math.min(PERFORMANCE.fpsMax, Math.round(MS_PER_SECOND / Math.max(1, this.#frameDuration)));
      this.#status.active = this.#shells.length;
      this.#report({ ...this.#status });
      this.#lastReport = timestamp;
    }
    if (
      this.#settings.quality === 'auto' &&
      this.#frames > PERFORMANCE.warmupFrames &&
      timestamp - this.#lastScaleChange > PERFORMANCE.adaptationInterval &&
      this.#frameDuration > PERFORMANCE.slowFrameMs &&
      this.#scale > PERFORMANCE.minScale
    ) {
      this.#scale *= PERFORMANCE.scaleStep;
      this.#updatePixelRatio();
      this.#lastScaleChange = timestamp;
    }
  };

  #spawn(launch: Launch): void {
    const x = launch.target.x * this.#camera.right;
    const y = (1 - launch.target.y) * SCENE.worldHeight;
    const origin: [number, number, number] = [x + random(...ROCKET.horizontalDrift), ROCKET.originY, 0];
    const ascent = random(...ROCKET.ascent);
    const gravity = ROCKET.gravity;
    const velocity: [number, number, number] = [
      (x - origin[0]) / ascent,
      (y - origin[1] - 0.5 * gravity * ascent * ascent) / ascent,
      0
    ];
    this.#field.emit(
      {
        origin,
        velocity,
        color: [...ROCKET.headColor],
        birth: launch.at,
        life: ascent,
        size: ROCKET.headSize,
        gravity,
        drag: ROCKET.drag
      },
      this.#time
    );
    const step = this.#settings.quality === 'low' ? ROCKET.trailStepLow : ROCKET.trailStepHigh;
    for (
      let t = 0;
      this.#shells.length + this.scheduler.pending < PERFORMANCE.detailedRocketLimit && t < ascent;
      t += step
    ) {
      this.#field.emit(
        {
          origin: [origin[0] + velocity[0] * t, origin[1] + velocity[1] * t + 0.5 * gravity * t * t, 0],
          velocity: [random(...ROCKET.trailDrift), ROCKET.trailVelocityY, 0],
          color: [...ROCKET.trailColor],
          birth: launch.at + t,
          life: ROCKET.trailLife,
          size: random(...ROCKET.trailSize),
          gravity: ROCKET.trailGravity,
          opacity: ROCKET.trailOpacity
        },
        this.#time
      );
    }
    this.#shells.push({
      at: launch.at + ascent,
      target: [x, y, 0],
      settings: launch.settings,
      done: false,
      end: launch.at + ascent + EXPLOSION.shellLife
    });
    this.#status.launched++;
    this.#sound({ kind: 'launch', pan: launch.target.x * 2 - 1, power: 1 });
  }

  #explode(shell: Shell): void {
    this.#sound({ kind: 'explosion', pan: (shell.target[0] / this.#camera.right) * 2 - 1, power: 1 });
    const settings = shell.settings;
    const palette = PALETTE_OPTIONS.filter((palette) => settings.palettes.includes(palette.id)).flatMap((palette) => [
      ...palette.colors
    ]);
    const layers = composePatterns(settings.patterns).map((pattern) => ({
      pattern,
      speed: random(...EXPLOSION.speed) * random(SHAPE_COMPOSITION.layerSpeedMin, SHAPE_COMPOSITION.layerSpeedMax),
      color: pickRandom(palette)
    }));
    const scratch = new Color();
    const detail =
      settings.quality === 'low' || (settings.quality === 'auto' && this.#coarse)
        ? PERFORMANCE.lowDetail
        : PERFORMANCE.highDetail;
    const budget = this.#field.capacity - this.#field.active(this.#time);
    const perShell = Math.max(
      EXPLOSION.minStars,
      Math.floor(
        (this.#field.capacity * PERFORMANCE.particleBudgetFraction) /
          Math.max(1, this.#shells.length + this.scheduler.pending)
      )
    );
    const tails = Math.min(
      detail < 1 ? EXPLOSION.trailLow : EXPLOSION.trailHigh,
      Math.max(1, Math.floor(perShell / EXPLOSION.stars))
    );
    const count = Math.max(
      0,
      Math.min(
        Math.max(EXPLOSION.minStars, Math.floor(EXPLOSION.stars * detail * layers.length)),
        Math.floor(perShell / tails),
        Math.floor((budget - EXPLOSION.reservedSlots) / tails)
      )
    );
    for (let i = 0; i < count; i++) {
      const layerIndex = i % layers.length;
      const layer = layers[layerIndex];
      if (!layer) {
        throw new Error('烟花形态图层不可用。');
      }
      const pattern = layer.pattern;
      const localCount = Math.ceil((count - layerIndex) / layers.length);
      const velocity = shapeVelocity(pattern, Math.floor(i / layers.length), localCount, layer.speed);
      const life = pattern === 'willow' ? random(...EXPLOSION.willowLife) : random(...EXPLOSION.normalLife);
      const colorSource = Math.random() < COLOR_RANDOM.mixChance ? pickRandom(palette) : layer.color;
      scratch
        .set(colorSource)
        .offsetHSL(
          random(-COLOR_RANDOM.hue, COLOR_RANDOM.hue),
          random(-COLOR_RANDOM.saturation, COLOR_RANDOM.saturation),
          random(-COLOR_RANDOM.lightness, COLOR_RANDOM.lightness)
        );
      const energy = EXPLOSION.energy * random(...COLOR_RANDOM.energy);
      const color: [number, number, number] =
        Math.random() < COLOR_RANDOM.goldChance
          ? [...EXPLOSION.goldColor]
          : [scratch.r * energy, scratch.g * energy, scratch.b * energy];
      for (let trail = 0; trail < tails; trail++) {
        this.#field.emit(
          {
            origin: shell.target,
            velocity,
            color,
            birth: shell.at,
            life,
            size: trail === 0 ? random(...EXPLOSION.starSize) : EXPLOSION.trailSize,
            gravity: pattern === 'willow' ? EXPLOSION.willowGravity : EXPLOSION.normalGravity,
            drag: pattern === 'willow' ? EXPLOSION.willowDrag : EXPLOSION.normalDrag,
            delay: trail * (pattern === 'willow' ? EXPLOSION.willowDelay : EXPLOSION.normalDelay),
            opacity: trail === 0 ? 1 : EXPLOSION.trailOpacity
          },
          this.#time
        );
      }
    }
    this.#field.emit(
      {
        origin: shell.target,
        velocity: [0, 0, 0],
        color: [...EXPLOSION.flashColor],
        birth: shell.at,
        life: EXPLOSION.flashLife,
        size: EXPLOSION.flashSize,
        gravity: 0,
        opacity: EXPLOSION.flashOpacity
      },
      this.#time
    );
  }

  #fail(message: string): void {
    if (this.#disposed) {
      return;
    }
    this.#status.ready = false;
    this.#status.error = message;
    this.#renderer?.setAnimationLoop(null);
    this.#report({ ...this.#status });
  }

  async dispose(): Promise<void> {
    this.#disposed = true;
    this.#observer?.disconnect();
    document.removeEventListener('visibilitychange', this.#onVisibility);
    this.#media.removeEventListener('change', this.#displayChanged);
    this.#renderer?.setAnimationLoop(null);
    this.#field.dispose();
    this.#sky.dispose();
    this.#pipeline?.dispose();
    this.#bloomPass?.dispose();
    this.#scenePass?.dispose();
    await this.#renderer?.dispose();
  }
}
