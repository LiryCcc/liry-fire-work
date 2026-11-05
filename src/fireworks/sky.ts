import { REDUCED_MOTION_QUERY, SCENE, SKY, TAU } from '@/constant.js';
import { attribute, positionGeometry, sin, uniform, uv, vec3 } from 'three/tsl';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  Points,
  PointsNodeMaterial,
  type Scene
} from 'three/webgpu';

/** Subtle procedural nebula, drifting/twinkling stars and a periodic meteor. */
export class DynamicSky {
  readonly #clock = uniform(0);
  readonly #width = uniform(SCENE.worldHeight);
  readonly #background: Mesh<PlaneGeometry, MeshBasicNodeMaterial>;
  readonly #stars: Points<BufferGeometry, PointsNodeMaterial>;
  readonly #meteor: Mesh<PlaneGeometry, MeshBasicNodeMaterial>;
  readonly #motionScale = matchMedia(REDUCED_MOTION_QUERY).matches ? SKY.reducedMotionScale : 1;

  constructor(scene: Scene) {
    const material = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false });
    const t = this.#clock.mul(SKY.drift);
    const cloud = sin(
      uv()
        .x.mul(SKY.frequencyX)
        .add(t)
        .add(sin(uv().y.mul(SKY.frequencyY).sub(t)))
    )
      .mul(sin(uv().y.mul(SKY.detailFrequency).add(uv().x).sub(t.mul(SKY.secondaryDrift))))
      .mul(0.5)
      .add(0.5)
      .pow(3);
    material.colorNode = vec3(...SKY.base)
      .add(vec3(...SKY.nebula).mul(cloud))
      .add(
        vec3(...SKY.aurora)
          .mul(sin(uv().x.mul(SKY.frequencyY).sub(t)).mul(0.5).add(0.5))
          .mul(uv().y.oneMinus())
      );
    this.#background = new Mesh(new PlaneGeometry(1, 1), material);
    this.#background.renderOrder = -3;
    scene.add(this.#background);

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        Array.from({ length: SCENE.starCount }, () => [
          Math.random(),
          Math.random(),
          SCENE.starZ[0] + Math.random() * (SCENE.starZ[1] - SCENE.starZ[0])
        ]).flat(),
        3
      )
    );
    geometry.setAttribute(
      'aPhase',
      new Float32BufferAttribute(
        Array.from({ length: SCENE.starCount }, () => Math.random() * TAU),
        1
      )
    );
    const stars = new PointsNodeMaterial({
      color: SCENE.starColor,
      size: SCENE.starSize,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false
    });
    const phase = attribute('aPhase', 'float');
    stars.opacityNode = sin(this.#clock.mul(SKY.twinkleSpeed).add(phase))
      .mul(SKY.twinkleAmount)
      .add(SKY.twinkleBase)
      .max(0);
    stars.positionNode = vec3(
      positionGeometry.x.add(this.#clock.mul(SKY.starDrift)).fract().mul(this.#width),
      positionGeometry.y.mul(SCENE.worldHeight),
      positionGeometry.z
    );
    this.#stars = new Points(geometry, stars);
    this.#stars.frustumCulled = false;
    this.#stars.renderOrder = -2;
    scene.add(this.#stars);

    const meteor = new MeshBasicNodeMaterial({
      color: SKY.meteorColor,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending
    });
    meteor.colorNode = vec3(1).mul(uv().x.pow(3)).mul(3);
    this.#meteor = new Mesh(new PlaneGeometry(SKY.meteorWidth, SKY.meteorHeight), meteor);
    this.#meteor.renderOrder = -1;
    scene.add(this.#meteor);
  }

  resize(width: number): void {
    this.#width.value = width;
    this.#background.scale.set(width, SCENE.worldHeight, 1);
    this.#background.position.set(width / 2, SCENE.worldHeight / 2, SKY.planeZ);
  }

  update(time: number): void {
    const clock = time * this.#motionScale;
    this.#clock.value = clock;
    const phase = (clock % SKY.meteorPeriod) / SKY.meteorDuration;
    this.#meteor.visible = phase <= 1;
    this.#meteor.material.opacity = Math.sin(Math.min(1, phase) * Math.PI);
    this.#meteor.position.set(
      this.#width.value * (SKY.meteorStartX - phase * SKY.meteorTravelX),
      SCENE.worldHeight * (SKY.meteorStartY - phase * SKY.meteorTravelY),
      SKY.meteorZ
    );
    this.#meteor.rotation.z = Math.atan2(SCENE.worldHeight * SKY.meteorTravelY, this.#width.value * SKY.meteorTravelX);
  }

  dispose(): void {
    for (const object of [this.#background, this.#stars, this.#meteor]) {
      object.geometry.dispose();
      object.material.dispose();
    }
  }
}
