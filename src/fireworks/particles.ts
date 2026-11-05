import { PARTICLE_SHADER } from '@/constant.js';
import { attribute, exp, float, positionGeometry, smoothstep, step, uniform, uv, vec3 } from 'three/tsl';
import {
  AdditiveBlending,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry
} from 'three/webgpu';

export interface Particle {
  origin: [number, number, number];
  velocity: [number, number, number];
  color: [number, number, number];
  birth: number;
  life: number;
  size: number;
  gravity?: number;
  drag?: number;
  delay?: number;
  opacity?: number;
}

/** A recycled instance pool. Only spawn attributes are uploaded; motion runs in TSL. */
export class ParticleField {
  readonly clock = uniform(0);
  readonly energy = uniform(1);
  readonly mesh: Mesh<InstancedBufferGeometry, MeshBasicNodeMaterial>;
  readonly #attributes: Record<'origin' | 'velocity' | 'color' | 'timing' | 'motion', InstancedBufferAttribute>;
  readonly #expiry: Float32Array;
  #cursor = 0;
  #highWater = 0;
  #dirtyMin: number;
  #dirtyMax = -1;
  #countTime = -1;
  #activeCount = 0;
  readonly capacity: number;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError('粒子池容量必须是正整数。');
    }
    this.capacity = capacity;
    this.#expiry = new Float32Array(capacity);
    this.#dirtyMin = capacity;
    const base = new PlaneGeometry(1, 1);
    const geometry = new InstancedBufferGeometry();
    const index = base.getIndex();
    if (!index) {
      throw new Error('烟花四边形缺少几何索引。');
    }
    geometry.setIndex(index.clone());
    geometry.setAttribute('position', base.getAttribute('position').clone());
    geometry.setAttribute('uv', base.getAttribute('uv').clone());
    base.dispose();
    const buffer = (name: string, size: number) => {
      const value = new InstancedBufferAttribute(new Float32Array(capacity * size), size);
      value.setUsage(DynamicDrawUsage);
      geometry.setAttribute(name, value);
      return value;
    };
    this.#attributes = {
      origin: buffer('aOrigin', 3),
      velocity: buffer('aVelocity', 3),
      color: buffer('aColor', 3),
      timing: buffer('aTiming', 4),
      motion: buffer('aMotion', 3)
    };
    const timing = attribute('aTiming', 'vec4');
    const motion = attribute('aMotion', 'vec3');
    const age = this.clock.sub(timing.x);
    const elapsed = age.sub(motion.y).max(0);
    const drag = motion.x.max(PARTICLE_SHADER.minDrag);
    const travel = float(1)
      .sub(exp(elapsed.mul(drag).negate()))
      .div(drag);
    const trajectory = attribute('aOrigin', 'vec3')
      .add(attribute('aVelocity', 'vec3').mul(travel))
      .add(vec3(0, timing.w.mul(elapsed.pow(2)).mul(0.5), 0));
    const lifeFraction = age.div(timing.y.max(PARTICLE_SHADER.minLife)).clamp(0, 1);
    const size = timing.z.mul(float(1).sub(lifeFraction.mul(PARTICLE_SHADER.sizeDecay)));
    const radial = uv().sub(0.5).length();
    const material = new MeshBasicNodeMaterial();
    material.positionNode = trajectory.add(vec3(positionGeometry.xy.mul(size), 0));
    material.colorNode = attribute('aColor', 'vec3')
      .mul(this.energy)
      .mul(float(1).add(exp(radial.mul(PARTICLE_SHADER.coreFalloff)).mul(PARTICLE_SHADER.coreEnergy)));
    material.opacityNode = float(1)
      .sub(smoothstep(PARTICLE_SHADER.coreRadius, PARTICLE_SHADER.outerRadius, radial))
      .mul(float(1).sub(lifeFraction).pow(PARTICLE_SHADER.fadePower))
      .mul(step(motion.y, age))
      .mul(step(age, timing.y))
      .mul(exp(motion.y.mul(PARTICLE_SHADER.trailFalloff)))
      .mul(motion.z);
    material.transparent = true;
    material.blending = AdditiveBlending;
    material.depthTest = false;
    material.depthWrite = false;
    material.alphaTest = PARTICLE_SHADER.alphaCutoff;
    this.mesh = new Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    geometry.instanceCount = 0;
  }

  emit(particle: Particle, now: number): boolean {
    if (this.#countTime === now && this.#activeCount >= this.capacity) {
      return false;
    }
    // Never overwrite a live particle, including trails scheduled later in a rocket's ascent.
    let searched = 0;
    while (searched < this.capacity) {
      const expiry = this.#expiry[this.#cursor];
      if (expiry === undefined) {
        throw new RangeError('粒子池游标越界。');
      }
      if (expiry <= now) {
        break;
      }
      this.#cursor = (this.#cursor + 1) % this.capacity;
      searched++;
    }
    if (searched === this.capacity) {
      return false;
    }
    const index = this.#cursor;
    const a = this.#attributes;
    a.origin.setXYZ(index, ...particle.origin);
    a.velocity.setXYZ(index, ...particle.velocity);
    a.color.setXYZ(index, ...particle.color);
    a.timing.setXYZW(
      index,
      particle.birth,
      particle.life,
      particle.size,
      particle.gravity ?? PARTICLE_SHADER.defaultGravity
    );
    a.motion.setXYZ(index, particle.drag ?? PARTICLE_SHADER.defaultDrag, particle.delay ?? 0, particle.opacity ?? 1);
    this.#expiry[index] = particle.birth + particle.life;
    if (this.#countTime === now) {
      this.#activeCount++;
    }
    this.#dirtyMin = Math.min(this.#dirtyMin, index);
    this.#dirtyMax = Math.max(this.#dirtyMax, index);
    this.#highWater = Math.max(this.#highWater, index + 1);
    this.#cursor = (index + 1) % this.capacity;
    return true;
  }

  update(now: number): void {
    this.clock.value = now;
    if (this.#dirtyMax < 0) {
      return;
    }
    for (const attribute of Object.values(this.#attributes)) {
      attribute.addUpdateRange(
        this.#dirtyMin * attribute.itemSize,
        (this.#dirtyMax - this.#dirtyMin + 1) * attribute.itemSize
      );
      attribute.needsUpdate = true;
    }
    this.mesh.geometry.instanceCount = this.#highWater;
    this.#dirtyMin = this.capacity;
    this.#dirtyMax = -1;
  }

  active(now: number): number {
    if (this.#countTime === now) {
      return this.#activeCount;
    }
    let count = 0;
    for (const expiry of this.#expiry.subarray(0, this.#highWater)) {
      if (expiry > now) {
        count++;
      }
    }
    this.#countTime = now;
    this.#activeCount = count;
    return count;
  }

  clear(): void {
    this.#expiry.fill(0);
    this.#cursor = 0;
    this.#highWater = 0;
    this.#countTime = -1;
    this.#activeCount = 0;
    this.#dirtyMin = this.capacity;
    this.#dirtyMax = -1;
    this.mesh.geometry.instanceCount = 0;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
