export type VectorLike = {
  x?: number;
  y?: number;
  z?: number;
};

export type MaterialOptions = {
  color?: string;
  texture?: string;
  roughness?: number;
  metalness?: number;
};

export type TransformOptions = VectorLike & {
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
};

export type SceneOptions = {
  container?: HTMLElement;
  defaultObjectColor?: string;
  skyColor?: string;
  fov?: number;
  near?: number;
  far?: number;
  antialias?: boolean;
  autoStart?: boolean;
};

export type BoxOptions = TransformOptions & MaterialOptions & {
  id?: string;
  width?: number;
  height?: number;
  depth?: number;
};

export type SphereOptions = TransformOptions & MaterialOptions & {
  id?: string;
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
};

export type CylinderOptions = TransformOptions & MaterialOptions & {
  id?: string;
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
};

export type PlaneOptions = TransformOptions & MaterialOptions & {
  id?: string;
  width?: number;
  height?: number;
};

export type ImportOBJOptions = TransformOptions & MaterialOptions & {
  id?: string;
  recolorChildren?: boolean;
};

export type AmbientLightOptions = {
  id?: string;
  color?: string;
  brightness?: number;
  intensity?: number;
};

export type DirectionalLightOptions = AmbientLightOptions & VectorLike & {
  castShadow?: boolean;
};

export type PointLightOptions = AmbientLightOptions & VectorLike & {
  range?: number;
  distance?: number;
};

export type SpotLightOptions = PointLightOptions & {
  angle?: number;
  penumbra?: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
};

export type PhysicsOptions = {
  enabled?: boolean;
  mass?: number;
  useGravity?: boolean;
  bounciness?: number;
  damping?: number;
  isKinematic?: boolean;
  vx?: number;
  vy?: number;
  vz?: number;
};

export type WeldOptions = {
  id?: string;
  anchor?: string | object;
};

export type WeldInfo = {
  id: string;
  anchorId: string;
  memberIds: string[];
};

export class PolygonalScene {
  constructor(options?: SceneOptions);

  start(): void;
  stop(): void;
  destroy(): void;
  resize(): void;

  onUpdate(callback: (delta: number) => void): () => void;

  createBox(options?: BoxOptions): string;
  createSphere(options?: SphereOptions): string;
  createCylinder(options?: CylinderOptions): string;
  createPlane(options?: PlaneOptions): string;
  importOBJ(url: string, options?: ImportOBJOptions): Promise<string>;

  removeObject(target: string | object): boolean;
  getObject(target: string | object): object | null;

  moveObjectTo(target: string | object, x: number, y: number, z: number): boolean;
  moveObjectBy(target: string | object, dx?: number, dy?: number, dz?: number): boolean;
  scaleObjectTo(target: string | object, x?: number, y?: number, z?: number): boolean;
  scaleObjectBy(target: string | object, sx?: number, sy?: number, sz?: number): boolean;
  rotateObjectTo(target: string | object, x?: number, y?: number, z?: number): boolean;
  rotateObjectBy(target: string | object, dx?: number, dy?: number, dz?: number): boolean;
  setObjectColor(target: string | object, color: string): boolean;
  setObjectTexture(target: string | object, textureUrl: string): boolean;
  enablePhysics(target: string | object, options?: PhysicsOptions): boolean;
  disablePhysics(target: string | object): boolean;
  setPhysicsVelocity(target: string | object, vx?: number, vy?: number, vz?: number): boolean;
  addForce(target: string | object, fx?: number, fy?: number, fz?: number): boolean;
  setGravity(x?: number, y?: number, z?: number): void;
  setPhysicsFloor(y: number): void;
  clearPhysicsFloor(): void;
  createWeld(targets: Array<string | object>, options?: WeldOptions): string | null;
  removeWeld(weldId: string): boolean;
  getWeld(weldId: string): WeldInfo | null;

  checkCollision(targetA: string | object, targetB: string | object): boolean;
  getHoveredObject(): object | null;
  isHovering(target: string | object): boolean;

  setCameraPosition(x: number, y: number, z: number): void;
  moveCameraBy(dx?: number, dy?: number, dz?: number): void;
  rotateCameraTo(x?: number, y?: number, z?: number): void;
  lookAt(x: number, y: number, z: number): void;
  setCameraFov(fov: number): void;

  createAmbientLight(options?: AmbientLightOptions): string;
  createDirectionalLight(options?: DirectionalLightOptions): string;
  createPointLight(options?: PointLightOptions): string;
  createSpotLight(options?: SpotLightOptions): string;

  moveLightTo(target: string | object, x: number, y: number, z: number): boolean;
  moveLightBy(target: string | object, dx?: number, dy?: number, dz?: number): boolean;
  setLightColor(target: string | object, color: string): boolean;
  setLightBrightness(target: string | object, brightness: number): boolean;
  setLightRange(target: string | object, range: number): boolean;
  removeLight(target: string | object): boolean;
  getLight(target: string | object): object | null;

  setSkyColor(color: string): void;
  setSkyTexture(url: string, mapping?: number): void;
  setCloudTexture(url: string): void;
  setSunColor(color: string): void;
  setMoonColor(color: string): void;
  setSunTexture(url: string): void;
  setMoonTexture(url: string): void;
  setTimeOfDay(hours: number): void;
  setFog(color: string, near?: number, far?: number): void;
  clearFog(): void;
}

export function createScene(options?: SceneOptions): PolygonalScene;

// Backward-compatible aliases
export type WorldOptions = SceneOptions;
export { PolygonalScene as PolygonalWorld };
export { createScene as createWorld };
