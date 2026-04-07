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

export type PointOptions = TransformOptions & {
  id?: string;
  visible?: boolean;
  pickable?: boolean;
};

export type StretchPlaneOptions = {
  id?: string;
  color?: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  width?: number;
  normal?: { x?: number; y?: number; z?: number };
  pickable?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

export type SunDirectionOptions = {
  distance?: number;
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

export type GroupOptions = {
  id?: string;
  primary?: string | object;
};

export type GroupInfo = {
  id: string;
  primaryId: string;
  memberIds: string[];
};

export type SpringWeldOptions = {
  id?: string;
  minLength?: number;
  maxLength?: number;
  elasticity?: number;
};

export type RopeWeldOptions = {
  id?: string;
  length?: number;
  minLength?: number;
  maxLength?: number;
};

export type ElasticWeldOptions = {
  id?: string;
  minLength?: number;
  maxLength?: number;
  elasticity?: number;
  slack?: number;
};

export type WeldType = "spring" | "rope" | "elastic";

export type WeldInfo = {
  id: string;
  type: WeldType;
  anchorId: string;
  memberId: string | null;
  length?: number;
  minLength?: number;
  maxLength?: number;
  elasticity?: number;
  slack?: number;
};

export type CollisionMode = "none" | "simple" | "precise";

export type OutlineOptions = {
  color?: string;
  opacity?: number;
  linewidth?: number;
  thresholdAngle?: number;
};

export type PolygonalObjectRef = object & {
  moveObjectTo(x: number, y: number, z: number): boolean;
  moveObjectBy(dx?: number, dy?: number, dz?: number): boolean;
  scaleObjectTo(x?: number, y?: number, z?: number): boolean;
  scaleObjectBy(sx?: number, sy?: number, sz?: number): boolean;
  rotateObjectTo(x?: number, y?: number, z?: number): boolean;
  rotateObjectBy(dx?: number, dy?: number, dz?: number): boolean;
  setObjectColor(color: string): boolean;
  setObjectTexture(textureUrl: string): boolean;
  setObjectTransparency(transparency?: number): boolean;
  setObjectReflectance(reflectance?: number): boolean;
  setObjectCollisionMode(mode?: CollisionMode): boolean;
  enableObjectOutline(options?: OutlineOptions): boolean;
  disableObjectOutline(): boolean;
  enablePhysics(options?: PhysicsOptions): boolean;
  disablePhysics(): boolean;
  setPhysicsVelocity(vx?: number, vy?: number, vz?: number): boolean;
  addForce(fx?: number, fy?: number, fz?: number): boolean;
  distanceToObject(other: string | object): number | null;
  remove(): boolean;
};

export type SoundOptions = {
  id?: string;
  loop?: boolean;
  volume?: number;
  autoplay?: boolean;
  range?: number;
  target?: string | object;
  x?: number;
  y?: number;
  z?: number;
};

export type SoundInfo = {
  id: string;
  kind: "global" | "local";
  volume: number;
  range: number;
  target: string | null;
  x: number;
  y: number;
  z: number;
};

export type InterfaceMode = "overlay" | "surface";

export type InterfaceOptions = {
  id?: string;
  mode?: InterfaceMode;
  target?: string | object;
  localX?: number;
  localY?: number;
  localZ?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  background?: string;
  text?: string;
  svg?: string;
  color?: string;
  fontSize?: number;
  clickable?: boolean;
  layer?: number;
  onClick?: (event: InterfaceClickEvent) => void;
  alignX?: string;
  alignY?: string;
};

export type InterfaceClickEvent = {
  id: string;
  x: number;
  y: number;
  target: string | null;
  mode: InterfaceMode;
  originalEvent: MouseEvent;
};

export type InterfaceAttachOptions = {
  localX?: number;
  localY?: number;
  localZ?: number;
};

export type InterfaceInfo = {
  id: string;
  mode: InterfaceMode;
  target: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  clickable: boolean;
  layer: number;
};

export class PolygonalScene {
  constructor(options?: SceneOptions);

  start(): void;
  stop(): void;
  destroy(): void;
  resize(): void;

  onUpdate(callback: (delta: number) => void): () => void;

  createBox(options?: BoxOptions): PolygonalObjectRef;
  createSphere(options?: SphereOptions): PolygonalObjectRef;
  createCylinder(options?: CylinderOptions): PolygonalObjectRef;
  createPlane(options?: PlaneOptions): PolygonalObjectRef;
  createPoint(options?: PointOptions): PolygonalObjectRef;
  createStretchPlane(points: Array<string | object>, options?: StretchPlaneOptions): PolygonalObjectRef | null;
  importOBJ(url: string, options?: ImportOBJOptions): Promise<PolygonalObjectRef>;

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
  setObjectTransparency(target: string | object, transparency?: number): boolean;
  setObjectReflectance(target: string | object, reflectance?: number): boolean;
  setObjectCollisionMode(target: string | object, mode?: CollisionMode): boolean;
  enableObjectOutline(target: string | object, options?: OutlineOptions): boolean;
  disableObjectOutline(target: string | object): boolean;
  getDistanceBetweenObjects(targetA: string | object, targetB: string | object): number | null;
  getObjectsUnderCursor(): object[];
  enablePhysics(target: string | object, options?: PhysicsOptions): boolean;
  disablePhysics(target: string | object): boolean;
  setPhysicsVelocity(target: string | object, vx?: number, vy?: number, vz?: number): boolean;
  addForce(target: string | object, fx?: number, fy?: number, fz?: number): boolean;
  setGravity(x?: number, y?: number, z?: number): void;
  setPhysicsFloor(y: number): void;
  clearPhysicsFloor(): void;
  createGroup(targets: Array<string | object>, options?: GroupOptions): string | null;
  setGroupPrimary(groupId: string, target: string | object): boolean;
  moveGroupBy(groupId: string, dx?: number, dy?: number, dz?: number): boolean;
  rotateGroupBy(groupId: string, dx?: number, dy?: number, dz?: number): boolean;
  getGroup(groupId: string): GroupInfo | null;
  removeGroup(groupId: string): boolean;
  createSpringWeld(anchorTarget: string | object, memberTarget: string | object, options?: SpringWeldOptions): string | null;
  createRopeWeld(anchorTarget: string | object, memberTarget: string | object, options?: RopeWeldOptions): string | null;
  createElasticWeld(anchorTarget: string | object, memberTarget: string | object, options?: ElasticWeldOptions): string | null;
  getWeld(weldId: string): WeldInfo | null;
  removeWeld(weldId: string): boolean;

  createGlobalSound(url: string, options?: SoundOptions): string;
  createLocalSound(url: string, options?: SoundOptions): string;
  playSound(soundId: string): boolean;
  pauseSound(soundId: string): boolean;
  stopSound(soundId: string): boolean;
  setSoundVolume(soundId: string, volume: number): boolean;
  setLocalSoundPosition(soundId: string, x?: number, y?: number, z?: number): boolean;
  attachSoundToObject(soundId: string, target: string | object): boolean;
  removeSound(soundId: string): boolean;
  getSound(soundId: string): SoundInfo | null;

  createInterface(options?: InterfaceOptions): string;
  removeInterface(interfaceId: string): boolean;
  setInterfaceText(interfaceId: string, text: string): boolean;
  setInterfaceSVG(interfaceId: string, svgMarkup: string): boolean;
  setInterfaceMode(interfaceId: string, mode?: InterfaceMode): boolean;
  setInterfaceLayer(interfaceId: string, layer?: number): boolean;
  setInterfaceClickable(interfaceId: string, clickable?: boolean): boolean;
  onInterfaceClick(interfaceId: string, handler: (event: InterfaceClickEvent) => void): () => void;
  attachInterfaceToObject(interfaceId: string, target: string | object, options?: InterfaceAttachOptions): boolean;
  setInterfaceScreenPosition(interfaceId: string, x: number, y: number): boolean;
  moveInterfaceBy(interfaceId: string, dx?: number, dy?: number): boolean;
  resizeInterface(interfaceId: string, width: number, height: number): boolean;
  stretchInterface(interfaceId: string, scaleX?: number, scaleY?: number): boolean;
  rotateInterface(interfaceId: string, radians?: number): boolean;
  setInterfaceTransparency(interfaceId: string, transparency?: number): boolean;
  getInterface(interfaceId: string): InterfaceInfo | null;

  checkCollision(targetA: string | object, targetB: string | object): boolean;
  getHoveredObject(): object | null;
  isHovering(target: string | object): boolean;

  setCameraPosition(x: number, y: number, z: number): void;
  moveCameraBy(dx?: number, dy?: number, dz?: number): void;
  rotateCameraTo(x?: number, y?: number, z?: number): void;
  lookAt(x: number, y: number, z: number): void;
  setCameraFov(fov: number): void;

  createAmbientLight(options?: AmbientLightOptions): object;
  createDirectionalLight(options?: DirectionalLightOptions): object;
  createPointLight(options?: PointLightOptions): object;
  createSpotLight(options?: SpotLightOptions): object;

  moveLightTo(target: string | object, x: number, y: number, z: number): boolean;
  moveLightBy(target: string | object, dx?: number, dy?: number, dz?: number): boolean;
  setLightColor(target: string | object, color: string): boolean;
  setLightBrightness(target: string | object, brightness: number): boolean;
  setLightRange(target: string | object, range: number): boolean;
  removeLight(target: string | object): boolean;
  getLight(target: string | object): object | null;

  setSkyColor(color: string): void;
  setSunDirectionFromPoints(fromPoint: string | object, toPoint: string | object, options?: SunDirectionOptions): boolean;
  bindSunDirectionToPoints(fromPoint: string | object, toPoint: string | object, options?: SunDirectionOptions): boolean;
  clearSunDirectionBinding(): boolean;
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
