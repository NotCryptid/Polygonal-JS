import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

let idCounter = 0;

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

function toThreeColor(value, fallback = "#ffffff") {
  return new THREE.Color(value ?? fallback);
}

function toVector3(x = 0, y = 0, z = 0) {
  return new THREE.Vector3(x, y, z);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizePositiveNumber(value, fallback) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, value);
}

function normalizePositiveInteger(value, fallback) {
  const normalized = normalizePositiveNumber(value, fallback);
  if (normalized === fallback) {
    return fallback;
  }

  return Math.round(normalized);
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function normalizeImageMode(mode) {
  if (mode === "contain") {
    return "fit";
  }

  if (mode === "cover") {
    return "crop";
  }

  if (mode === "stretch" || mode === "fit" || mode === "tileX" || mode === "tileY" || mode === "tileXY" || mode === "crop") {
    return mode;
  }

  return "fit";
}

function normalizeRenderScaleMode(mode) {
  if (mode === "fit") {
    return "fit";
  }

  return "stretch";
}

function escapeCssUrl(url) {
  return String(url).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function resolveImageBackgroundPosition(options = {}) {
  const alignX = options.alignX ?? "center";
  const alignY = options.alignY ?? "center";
  const offsetX = options.tileOffsetX ?? 0;
  const offsetY = options.tileOffsetY ?? 0;
  const x = offsetX === 0 ? alignX : `calc(${alignX} + ${offsetX}px)`;
  const y = offsetY === 0 ? alignY : `calc(${alignY} + ${offsetY}px)`;
  return `${x} ${y}`;
}

function applyInterfaceImagePresentation(element, options = {}) {
  const mode = normalizeImageMode(options.mode ?? options.fit ?? "fit");
  const tileWidth = normalizePositiveNumber(options.tileWidth ?? options.tileSize, undefined);
  const tileHeight = normalizePositiveNumber(options.tileHeight ?? options.tileSize, undefined);

  element.style.backgroundImage = options.src ? `url("${escapeCssUrl(options.src)}")` : "none";
  element.style.backgroundPosition = resolveImageBackgroundPosition(options);

  if (mode === "stretch") {
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "100% 100%";
    return;
  }

  if (mode === "fit") {
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "contain";
    return;
  }

  if (mode === "crop") {
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "cover";
    return;
  }

  if (mode === "tileX") {
    element.style.backgroundRepeat = "repeat-x";
  } else if (mode === "tileY") {
    element.style.backgroundRepeat = "repeat-y";
  } else {
    element.style.backgroundRepeat = "repeat";
  }

  const sizeX = tileWidth !== undefined ? `${tileWidth}px` : "auto";
  const sizeY = tileHeight !== undefined ? `${tileHeight}px` : "auto";
  element.style.backgroundSize = `${sizeX} ${sizeY}`;
}

function applyInterfaceBackgroundPresentation(element, options = {}) {
  const mode = normalizeImageMode(options.mode ?? "fit");
  const tileWidth = normalizePositiveNumber(options.tileWidth ?? options.tileSize, undefined);
  const tileHeight = normalizePositiveNumber(options.tileHeight ?? options.tileSize, undefined);

  element.style.backgroundPosition = resolveImageBackgroundPosition(options);

  if (mode === "stretch") {
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "100% 100%";
    return;
  }

  if (mode === "fit") {
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "contain";
    return;
  }

  if (mode === "crop") {
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "cover";
    return;
  }

  if (mode === "tileX") {
    element.style.backgroundRepeat = "repeat-x";
  } else if (mode === "tileY") {
    element.style.backgroundRepeat = "repeat-y";
  } else {
    element.style.backgroundRepeat = "repeat";
  }

  const sizeX = tileWidth !== undefined ? `${tileWidth}px` : "auto";
  const sizeY = tileHeight !== undefined ? `${tileHeight}px` : "auto";
  element.style.backgroundSize = `${sizeX} ${sizeY}`;
}

function normalizeCollisionMode(mode) {
  if (mode === "none" || mode === "simple" || mode === "precise") {
    return mode;
  }
  return "simple";
}

function normalizeCollisionThickness(value, fallback = 0.05) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, value);
}

function applyTransform(target, options = {}) {
  const {
    x,
    y,
    z,
    scaleX,
    scaleY,
    scaleZ,
    rotationX,
    rotationY,
    rotationZ
  } = options;

  if (x !== undefined || y !== undefined || z !== undefined) {
    target.position.set(x ?? target.position.x, y ?? target.position.y, z ?? target.position.z);
  }

  if (scaleX !== undefined || scaleY !== undefined || scaleZ !== undefined) {
    target.scale.set(scaleX ?? target.scale.x, scaleY ?? target.scale.y, scaleZ ?? target.scale.z);
  }

  if (rotationX !== undefined || rotationY !== undefined || rotationZ !== undefined) {
    target.rotation.set(
      rotationX ?? target.rotation.x,
      rotationY ?? target.rotation.y,
      rotationZ ?? target.rotation.z
    );
  }
}

function makeMaterial(scene, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color: toThreeColor(options.color ?? scene.defaultObjectColor),
    roughness: options.roughness ?? 0.75,
    metalness: options.metalness ?? 0.1
  });

  if (options.texture) {
    material.map = scene.textureLoader.load(options.texture);
    material.needsUpdate = true;
  }

  return material;
}

class PolygonalScene {
  constructor(options = {}) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("Polygonal-JS requires a browser-like renderer context (HTML or Electron renderer).");
    }

    this.container = options.container ?? document.body;
    this.defaultObjectColor = options.defaultObjectColor ?? "#8ab4f8";

    this.scene = new THREE.Scene();
    this.scene.background = toThreeColor(options.skyColor ?? "#111827");

    this.camera = new THREE.PerspectiveCamera(
      options.fov ?? 60,
      1,
      options.near ?? 0.1,
      options.far ?? 2500
    );
    this.camera.position.set(0, 2, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: options.antialias ?? true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.renderSettings = {
      renderWidth: normalizePositiveInteger(options.renderWidth, undefined),
      renderHeight: normalizePositiveInteger(options.renderHeight, undefined),
      displayWidth: normalizePositiveInteger(options.displayWidth, undefined),
      displayHeight: normalizePositiveInteger(options.displayHeight, undefined),
      displayMode: normalizeRenderScaleMode(options.displayMode),
      letterboxColor: options.letterboxColor ?? "#000000"
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-2, -2);

    this.objects = new Map();
    this.lights = new Map();
    this.physicsBodies = new Map();
    this.welds = new Map();
    this.stretchPlanes = new Map();
    this.sounds = new Map();
    this.interfaces = new Map();
    this.updateCallbacks = new Set();
    this.meshesForPicking = [];

    this._hoveredObject = null;
    this._hoveredObjects = [];
    this._isRunning = false;
    this._raf = null;

    this.textureLoader = new THREE.TextureLoader();
    this.objLoader = new OBJLoader();

    this.environment = {
      skyTexture: null,
      cloudTexture: null,
      sunTexture: null,
      moonTexture: null,
      timeOfDay: 12
    };

    this.physics = {
      gravity: new THREE.Vector3(0, -9.81, 0),
      floorY: null
    };
    this.sunDirectionBinding = null;

    this._setupContainer();
    this._setupBaseLights();
    this._setupInterfaceLayer();
    this._attachEvents();
    this.resize();

    if (options.autoStart !== false) {
      this.start();
    }
  }

  _setupContainer() {
    if (this.container === document.body) {
      document.documentElement.style.width = "100%";
      document.documentElement.style.height = "100%";
      document.body.style.margin = "0";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
      document.body.style.overflow = "hidden";
    }

    this.container.style.overflow = "hidden";
    this.container.style.background = this.renderSettings.letterboxColor;

    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.top = "0";
    this.container.appendChild(this.renderer.domElement);
  }

  _setupInterfaceLayer() {
    const style = window.getComputedStyle(this.container);
    if (style.position === "static") {
      this.container.style.position = "relative";
    }

    this.interfaceLayer = document.createElement("div");
    this.interfaceLayer.style.position = "absolute";
    this.interfaceLayer.style.left = "0";
    this.interfaceLayer.style.top = "0";
    this.interfaceLayer.style.width = "0";
    this.interfaceLayer.style.height = "0";
    this.interfaceLayer.style.pointerEvents = "none";
    this.interfaceLayer.style.overflow = "hidden";
    this.container.appendChild(this.interfaceLayer);
  }

  _setupBaseLights() {
    const ambient = new THREE.AmbientLight("#ffffff", 0.3);
    this.scene.add(ambient);
    this.lights.set("ambient_default", ambient);

    this.sunLight = new THREE.DirectionalLight("#fff5d6", 1.0);
    this.sunLight.position.set(40, 60, 20);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
    this.lights.set("sun_default", this.sunLight);

    this.moonLight = new THREE.DirectionalLight("#a4b7ff", 0.05);
    this.moonLight.position.set(-40, -30, -20);
    this.scene.add(this.moonLight);
    this.lights.set("moon_default", this.moonLight);
  }

  _attachEvents() {
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    this._onPointerMove = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    this.renderer.domElement.addEventListener("pointermove", this._onPointerMove);
    this.renderer.domElement.addEventListener("pointerleave", () => {
      this.pointer.set(-2, -2);
      this._hoveredObject = null;
    });
  }

  _registerObject(object, preferredId, pickable = true) {
    const id = preferredId ?? nextId("object");
    object.userData.polygonalId = id;
    object.userData.collisionMode = normalizeCollisionMode(object.userData.collisionMode);
    this._attachObjectShortcuts(object);
    this.objects.set(id, object);
    this.scene.add(object);

    if (pickable) {
      this.meshesForPicking.push(object);
    }

    return object;
  }

  _attachObjectShortcuts(object) {
    if (!object || object.userData?.polygonalShortcutsAttached) {
      return;
    }

    const define = (name, fn) => {
      Object.defineProperty(object, name, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: fn
      });
    };

    define("moveObjectTo", (x, y, z) => this.moveObjectTo(object, x, y, z));
    define("moveObjectBy", (dx = 0, dy = 0, dz = 0) => this.moveObjectBy(object, dx, dy, dz));
    define("scaleObjectTo", (x = 1, y = 1, z = 1) => this.scaleObjectTo(object, x, y, z));
    define("scaleObjectBy", (sx = 1, sy = 1, sz = 1) => this.scaleObjectBy(object, sx, sy, sz));
    define("rotateObjectTo", (x = 0, y = 0, z = 0) => this.rotateObjectTo(object, x, y, z));
    define("rotateObjectBy", (dx = 0, dy = 0, dz = 0) => this.rotateObjectBy(object, dx, dy, dz));
    define("setObjectColor", (color) => this.setObjectColor(object, color));
    define("setObjectTexture", (textureUrl) => this.setObjectTexture(object, textureUrl));
    define("setObjectTransparency", (value = 0) => this.setObjectTransparency(object, value));
    define("setObjectReflectance", (value = 0) => this.setObjectReflectance(object, value));
    define("setObjectCollisionMode", (mode = "simple") => this.setObjectCollisionMode(object, mode));
    define("enableObjectOutline", (options = {}) => this.enableObjectOutline(object, options));
    define("disableObjectOutline", () => this.disableObjectOutline(object));
    define("enablePhysics", (options = {}) => this.enablePhysics(object, options));
    define("disablePhysics", () => this.disablePhysics(object));
    define("setPhysicsVelocity", (vx = 0, vy = 0, vz = 0) => this.setPhysicsVelocity(object, vx, vy, vz));
    define("addForce", (fx = 0, fy = 0, fz = 0) => this.addForce(object, fx, fy, fz));
    define("distanceToObject", (other) => this.getDistanceBetweenObjects(object, other));
    define("remove", () => this.removeObject(object));

    object.userData.polygonalShortcutsAttached = true;
  }

  _registerLight(light, preferredId) {
    const id = preferredId ?? nextId("light");
    light.userData.polygonalId = id;
    this.lights.set(id, light);
    this.scene.add(light);
    return light;
  }

  _resolveObject(target) {
    if (typeof target === "string") {
      return this.objects.get(target) ?? null;
    }

    if (target && target.userData?.polygonalId) {
      return this.objects.get(target.userData.polygonalId) ?? target;
    }

    return null;
  }

  _resolveLight(target) {
    if (typeof target === "string") {
      return this.lights.get(target) ?? null;
    }

    if (target && target.userData?.polygonalId) {
      return this.lights.get(target.userData.polygonalId) ?? target;
    }

    return null;
  }

  _updateHoverState() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(this.meshesForPicking, true);

    if (intersections.length === 0) {
      this._hoveredObject = null;
      this._hoveredObjects = [];
      return;
    }

    const orderedOwners = [];
    const seen = new Set();

    for (const hit of intersections) {
      const owner = this._findOwnedObject(hit.object);
      if (!owner) {
        continue;
      }

      const id = owner.userData?.polygonalId;
      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);
      orderedOwners.push(owner);
    }

    this._hoveredObjects = orderedOwners;
    this._hoveredObject = orderedOwners[0] ?? null;
  }

  _findOwnedObject(node) {
    let current = node;

    while (current) {
      if (current.userData?.polygonalId && this.objects.has(current.userData.polygonalId)) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

  _resolveObjectId(target) {
    if (typeof target === "string") {
      return this.objects.has(target) ? target : null;
    }

    if (target && target.userData?.polygonalId && this.objects.has(target.userData.polygonalId)) {
      return target.userData.polygonalId;
    }

    return null;
  }

  _resolveObjectIds(targets = []) {
    return targets
      .map((target) => this._resolveObjectId(target))
      .filter((id) => Boolean(id));
  }

  _detachObjectFromWelds(objectId) {
    const weldIds = [...this.welds.keys()];

    for (const weldId of weldIds) {
      const weld = this.welds.get(weldId);
      if (!weld) {
        continue;
      }

      if (weld.anchorId === objectId) {
        this.welds.delete(weldId);
        continue;
      }

      if (weld.memberIds.includes(objectId)) {
        weld.memberIds = weld.memberIds.filter((id) => id !== objectId);
        weld.offsets.delete(objectId);

        if (weld.memberIds.length === 0) {
          this.welds.delete(weldId);
        }
      }
    }
  }

  _detachObjectFromStretchPlanes(objectId) {
    const stretchPlaneIds = [...this.stretchPlanes.keys()];

    for (const planeId of stretchPlaneIds) {
      const descriptor = this.stretchPlanes.get(planeId);
      if (!descriptor) {
        continue;
      }

      if (descriptor.objectId === objectId) {
        this.stretchPlanes.delete(planeId);
        continue;
      }

      if (descriptor.pointIds.includes(objectId)) {
        descriptor.pointIds = descriptor.pointIds.filter((id) => id !== objectId);
        if (descriptor.pointIds.length < 2) {
          this.removeObject(descriptor.objectId);
          this.stretchPlanes.delete(planeId);
        }
      }
    }
  }

  _buildStretchPlaneGeometry(points, options = {}) {
    if (points.length < 2) {
      return null;
    }

    const geometry = new THREE.BufferGeometry();

    if (points.length === 2) {
      const width = options.width ?? 0.35;
      const p0 = points[0];
      const p1 = points[1];
      const direction = new THREE.Vector3().subVectors(p1, p0);
      const length = direction.length();
      if (length < 1e-6) {
        return null;
      }

      direction.normalize();
      const up = options.normal
        ? toVector3(options.normal.x ?? 0, options.normal.y ?? 1, options.normal.z ?? 0).normalize()
        : new THREE.Vector3(0, 1, 0);

      if (Math.abs(direction.dot(up)) > 0.98) {
        up.set(1, 0, 0);
      }

      const side = new THREE.Vector3().crossVectors(direction, up).normalize().multiplyScalar(width / 2);
      const vertices = [
        p0.clone().add(side),
        p0.clone().sub(side),
        p1.clone().sub(side),
        p1.clone().add(side)
      ];

      const flat = new Float32Array(vertices.flatMap((v) => [v.x, v.y, v.z]));
      geometry.setAttribute("position", new THREE.BufferAttribute(flat, 3));
      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      geometry.computeVertexNormals();
      return geometry;
    }

    const centroid = points.reduce((acc, point) => acc.add(point.clone()), new THREE.Vector3()).multiplyScalar(1 / points.length);
    let normal = null;

    for (let i = 2; i < points.length; i += 1) {
      const a = new THREE.Vector3().subVectors(points[1], points[0]);
      const b = new THREE.Vector3().subVectors(points[i], points[0]);
      const n = new THREE.Vector3().crossVectors(a, b);
      if (n.lengthSq() > 1e-8) {
        normal = n.normalize();
        break;
      }
    }

    if (!normal) {
      normal = new THREE.Vector3(0, 1, 0);
    }

    let u = new THREE.Vector3().subVectors(points[0], centroid);
    if (u.lengthSq() < 1e-8) {
      u = new THREE.Vector3(1, 0, 0);
    }
    u.normalize();
    const v = new THREE.Vector3().crossVectors(normal, u).normalize();

    const sorted = [...points].sort((left, right) => {
      const l = new THREE.Vector3().subVectors(left, centroid);
      const r = new THREE.Vector3().subVectors(right, centroid);
      const lAngle = Math.atan2(l.dot(v), l.dot(u));
      const rAngle = Math.atan2(r.dot(v), r.dot(u));
      return lAngle - rAngle;
    });

    const flat = new Float32Array(sorted.flatMap((point) => [point.x, point.y, point.z]));
    geometry.setAttribute("position", new THREE.BufferAttribute(flat, 3));

    const indices = [];
    for (let i = 1; i < sorted.length - 1; i += 1) {
      indices.push(0, i, i + 1);
    }

    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  _updateStretchPlanes() {
    if (this.stretchPlanes.size === 0) {
      return;
    }

    for (const [planeId, descriptor] of this.stretchPlanes.entries()) {
      const planeObject = this.objects.get(descriptor.objectId);
      if (!planeObject) {
        this.stretchPlanes.delete(planeId);
        continue;
      }

      const points = descriptor.pointIds
        .map((id) => this.objects.get(id))
        .filter((entry) => Boolean(entry))
        .map((entry) => {
          const worldPosition = new THREE.Vector3();
          entry.getWorldPosition(worldPosition);
          return worldPosition;
        });

      if (points.length < 2) {
        continue;
      }

      const geometry = this._buildStretchPlaneGeometry(points, descriptor.options);
      if (!geometry) {
        continue;
      }

      const mesh = planeObject;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      mesh.geometry = geometry;
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
    }
  }

  _updateSunDirectionBinding() {
    if (!this.sunDirectionBinding) {
      return;
    }

    this.setSunDirectionFromPoints(
      this.sunDirectionBinding.from,
      this.sunDirectionBinding.to,
      this.sunDirectionBinding.options
    );
  }

  _projectWorldToScreen(position) {
    const projected = position.clone().project(this.camera);

    return {
      x: ((projected.x + 1) / 2) * this.renderer.domElement.clientWidth,
      y: ((-projected.y + 1) / 2) * this.renderer.domElement.clientHeight,
      visible: projected.z >= -1 && projected.z <= 1
    };
  }

  _updateInterfaces() {
    if (this.interfaces.size === 0) {
      return;
    }

    for (const iface of this.interfaces.values()) {
      const { element } = iface;

      if (iface.mode === "surface") {
        const object = this._resolveObject(iface.target);
        if (!object) {
          element.style.display = "none";
          continue;
        }

        const worldPos = toVector3(iface.localX, iface.localY, iface.localZ);
        object.updateMatrixWorld(true);
        worldPos.applyMatrix4(object.matrixWorld);

        const point = this._projectWorldToScreen(worldPos);
        if (!point.visible) {
          element.style.display = "none";
          continue;
        }

        element.style.display = "block";
        iface.x = point.x;
        iface.y = point.y;
      }

      element.style.width = `${iface.width}px`;
      element.style.height = `${iface.height}px`;
      element.style.opacity = String(clamp(iface.opacity, 0, 1));
      element.style.transform = `translate(${iface.x}px, ${iface.y}px) translate(-50%, -50%) rotate(${iface.rotation}rad) scale(${iface.scaleX}, ${iface.scaleY})`;
    }
  }

  _updateSounds() {
    if (this.sounds.size === 0) {
      return;
    }

    for (const sound of this.sounds.values()) {
      if (sound.kind !== "local") {
        continue;
      }

      let position = null;

      if (sound.target) {
        const object = this._resolveObject(sound.target);
        if (object) {
          position = new THREE.Vector3();
          object.getWorldPosition(position);
        }
      }

      if (!position) {
        position = toVector3(sound.x, sound.y, sound.z);
      }

      const distance = position.distanceTo(this.camera.position);
      const normalized = clamp(1 - distance / Math.max(0.001, sound.range), 0, 1);
      sound.audio.volume = clamp(sound.baseVolume * normalized, 0, 1);
    }
  }

  _cleanupSound(sound) {
    if (!sound || !sound.audio) {
      return;
    }

    sound.audio.pause();
    sound.audio.src = "";
    sound.audio.load();
  }

  _cleanupInterface(iface) {
    if (!iface) {
      return;
    }

    for (const entry of iface.clickHandlers ?? []) {
      iface.element.removeEventListener("click", entry.wrapped);
    }

    iface.element.remove();
  }

  _getCollisionMode(object) {
    return normalizeCollisionMode(object?.userData?.collisionMode);
  }

  _collectCollisionVolumes(object, mode) {
    const collisionThickness = normalizeCollisionThickness(object?.userData?.collisionThickness, 0);
    const expandVolume = (box) => {
      if (collisionThickness <= 0) {
        return box;
      }

      box.expandByScalar(collisionThickness / 2);
      return box;
    };

    if (mode === "precise") {
      const boxes = [];

      object.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        boxes.push(expandVolume(new THREE.Box3().setFromObject(child)));
      });

      return boxes.length > 0 ? boxes : [expandVolume(new THREE.Box3().setFromObject(object))];
    }

    return [expandVolume(new THREE.Box3().setFromObject(object))];
  }

  _hasCollisionBetween(a, b) {
    const modeA = this._getCollisionMode(a);
    const modeB = this._getCollisionMode(b);

    if (modeA === "none" || modeB === "none") {
      return false;
    }

    const precision = modeA === "precise" || modeB === "precise" ? "precise" : "simple";
    const volumesA = this._collectCollisionVolumes(a, precision);
    const volumesB = this._collectCollisionVolumes(b, precision);

    for (const volumeA of volumesA) {
      for (const volumeB of volumesB) {
        if (volumeA.intersectsBox(volumeB)) {
          return true;
        }
      }
    }

    return false;
  }

  _stepPhysics(delta) {
    if (this.physicsBodies.size === 0) {
      return;
    }

    for (const [id, body] of this.physicsBodies.entries()) {
      const object = this.objects.get(id);

      if (!object) {
        this.physicsBodies.delete(id);
        continue;
      }

      if (!body.enabled || body.isKinematic) {
        continue;
      }

      const previousPosition = object.position.clone();

      if (body.useGravity) {
        body.velocity.addScaledVector(this.physics.gravity, delta);
      }

      const damping = Math.min(1, Math.max(0, body.damping));
      body.velocity.multiplyScalar(damping);
      object.position.addScaledVector(body.velocity, delta);

      if (this.physics.floorY !== null) {
        const floorBounds = new THREE.Box3().setFromObject(object);

        if (floorBounds.min.y < this.physics.floorY) {
          object.position.y += this.physics.floorY - floorBounds.min.y;
          body.velocity.y = Math.abs(body.velocity.y) * body.bounciness;
        }
      }

      const bounds = new THREE.Box3().setFromObject(object);
      let collided = false;

      for (const [otherId, otherObject] of this.objects.entries()) {
        if (otherId === id) {
          continue;
        }

        const otherBody = this.physicsBodies.get(otherId);
        if (otherBody && otherBody.enabled && !otherBody.isKinematic) {
          continue;
        }

        const otherBounds = new THREE.Box3().setFromObject(otherObject);
        if (this._hasCollisionBetween(object, otherObject) && bounds.intersectsBox(otherBounds)) {
          collided = true;
          break;
        }
      }

      if (collided) {
        object.position.copy(previousPosition);
        body.velocity.multiplyScalar(-body.bounciness);
      }
    }
  }

  _applyDistanceConstraint(anchor, member, targetDistance, stiffness = 1) {
    const anchorPosition = new THREE.Vector3();
    const memberPosition = new THREE.Vector3();
    anchor.getWorldPosition(anchorPosition);
    member.getWorldPosition(memberPosition);

    const deltaVector = new THREE.Vector3().subVectors(memberPosition, anchorPosition);
    const currentDistance = deltaVector.length();

    if (currentDistance < 1e-6) {
      deltaVector.set(1, 0, 0);
    } else {
      deltaVector.multiplyScalar(1 / currentDistance);
    }

    const correction = (currentDistance - targetDistance) * clamp(stiffness, 0, 1);
    if (Math.abs(correction) < 1e-6) {
      return;
    }

    member.position.addScaledVector(deltaVector, -correction);
  }

  _createDistanceWeld(weldType, anchorTarget, memberTarget, options = {}) {
    const anchor = this._resolveObject(anchorTarget);
    const member = this._resolveObject(memberTarget);

    if (!anchor || !member) {
      return null;
    }

    const anchorId = anchor.userData.polygonalId;
    const memberId = member.userData.polygonalId;

    if (!anchorId || !memberId || anchorId === memberId) {
      return null;
    }

    const anchorPosition = new THREE.Vector3();
    const memberPosition = new THREE.Vector3();
    anchor.getWorldPosition(anchorPosition);
    member.getWorldPosition(memberPosition);
    const initialDistance = anchorPosition.distanceTo(memberPosition);

    const weldId = options.id ?? nextId(`${weldType}_weld`);
    const descriptor = {
      id: weldId,
      weldType,
      anchorId,
      memberIds: [memberId],
      offsets: new Map()
    };

    if (weldType === "rope") {
      const minLength = Math.max(0, options.minLength ?? 0);
      const configuredMax = options.maxLength ?? options.length ?? initialDistance;
      descriptor.minLength = minLength;
      descriptor.maxLength = Math.max(minLength, Math.max(0, configuredMax));
      descriptor.length = descriptor.maxLength;
    }

    if (weldType === "spring") {
      const minLength = Math.max(0, options.minLength ?? initialDistance * 0.5);
      const maxLength = Math.max(minLength, options.maxLength ?? initialDistance * 1.5);
      descriptor.minLength = minLength;
      descriptor.maxLength = maxLength;
      descriptor.elasticity = clamp(options.elasticity ?? 0.2, 0.01, 1);
    }

    if (weldType === "elastic") {
      const minLength = Math.max(0, options.minLength ?? initialDistance * 0.6);
      const maxLength = Math.max(minLength, options.maxLength ?? initialDistance * 1.8);
      descriptor.minLength = minLength;
      descriptor.maxLength = maxLength;
      descriptor.elasticity = clamp(options.elasticity ?? 0.08, 0.01, 1);
      descriptor.slack = Math.max(0, options.slack ?? (maxLength - minLength) * 0.4);
    }

    this.welds.set(weldId, descriptor);
    return weldId;
  }

  _createDeformWeld(anchorTarget, memberTarget, options = {}) {
    const anchor = this._resolveObject(anchorTarget);
    const member = this._resolveObject(memberTarget);

    if (!anchor || !member) {
      return null;
    }

    const anchorId = anchor.userData.polygonalId;
    const memberId = member.userData.polygonalId;

    if (!anchorId || !memberId || anchorId === memberId) {
      return null;
    }

    anchor.updateMatrixWorld(true);
    member.updateMatrixWorld(true);

    const localMatrix = new THREE.Matrix4()
      .copy(anchor.matrixWorld)
      .invert()
      .multiply(member.matrixWorld);

    const baseLocalPosition = new THREE.Vector3();
    const baseLocalQuaternion = new THREE.Quaternion();
    const baseLocalScale = new THREE.Vector3();
    localMatrix.decompose(baseLocalPosition, baseLocalQuaternion, baseLocalScale);

    const anchorPosition = new THREE.Vector3();
    const memberPosition = new THREE.Vector3();
    anchor.getWorldPosition(anchorPosition);
    member.getWorldPosition(memberPosition);
    const initialDistance = anchorPosition.distanceTo(memberPosition);

    const weldId = options.id ?? nextId("deform_weld");
    this.welds.set(weldId, {
      id: weldId,
      weldType: "deform",
      anchorId,
      memberIds: [memberId],
      offsets: new Map(),
      baseLocalPosition,
      baseLocalQuaternion,
      baseLocalScale,
      deformOffset: new THREE.Vector3(),
      minLength: Math.max(0, options.minLength ?? 0),
      durability: Math.max(0.1, options.durability ?? 1),
      recovery: clamp(options.recovery ?? 0.08, 0, 1),
      maxDeformation: Math.max(0, options.maxDeformation ?? Math.max(initialDistance * 2, 0.1))
    });

    return weldId;
  }

  _updateWelds(delta = 1 / 60) {
    if (this.welds.size === 0) {
      return;
    }

    for (const [weldId, weld] of this.welds.entries()) {
      if (weld.weldType === "group") {
        const anchor = this.objects.get(weld.anchorId);

        if (!anchor) {
          this.welds.delete(weldId);
          continue;
        }

        anchor.updateMatrixWorld(true);

        for (const memberId of weld.memberIds) {
          const member = this.objects.get(memberId);
          const offset = weld.offsets.get(memberId);

          if (!member || !offset) {
            continue;
          }

          const worldMatrix = new THREE.Matrix4().multiplyMatrices(anchor.matrixWorld, offset);
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          worldMatrix.decompose(position, quaternion, scale);

          member.position.copy(position);
          member.quaternion.copy(quaternion);
          member.scale.copy(scale);
        }

        continue;
      }

      const anchor = this.objects.get(weld.anchorId);
      const memberId = weld.memberIds?.[0] ?? null;
      const member = memberId ? this.objects.get(memberId) : null;

      if (!anchor || !member) {
        this.welds.delete(weldId);
        continue;
      }

      const anchorPosition = new THREE.Vector3();
      const memberPosition = new THREE.Vector3();
      anchor.getWorldPosition(anchorPosition);
      member.getWorldPosition(memberPosition);
      const currentDistance = anchorPosition.distanceTo(memberPosition);

      if (weld.weldType === "rope") {
        const minLength = Math.max(0, weld.minLength ?? 0);
        const maxLength = Math.max(minLength, weld.maxLength ?? weld.length ?? 0);

        if (currentDistance < minLength) {
          this._applyDistanceConstraint(anchor, member, minLength, 1);
        } else if (currentDistance > maxLength) {
          this._applyDistanceConstraint(anchor, member, maxLength, 1);
        }
        continue;
      }

      if (weld.weldType === "spring") {
        const minLength = Math.max(0, weld.minLength ?? 0);
        const maxLength = Math.max(minLength, weld.maxLength ?? minLength);
        const targetDistance = clamp(currentDistance, minLength, maxLength);
        const response = clamp((weld.elasticity ?? 0.2) * Math.min(1, delta * 60), 0.01, 1);
        this._applyDistanceConstraint(anchor, member, targetDistance, response);
        continue;
      }

      if (weld.weldType === "elastic") {
        const minLength = Math.max(0, weld.minLength ?? 0);
        const maxLength = Math.max(minLength, weld.maxLength ?? minLength);
        const slack = Math.max(0, weld.slack ?? 0);

        if (currentDistance > maxLength + slack) {
          const response = clamp((weld.elasticity ?? 0.08) * Math.min(1, delta * 60), 0.01, 0.4);
          this._applyDistanceConstraint(anchor, member, maxLength, response);
          continue;
        }

        if (currentDistance < minLength - slack * 0.5) {
          const response = clamp((weld.elasticity ?? 0.08) * 0.5 * Math.min(1, delta * 60), 0.01, 0.25);
          this._applyDistanceConstraint(anchor, member, minLength, response);
        }
        continue;
      }

      if (weld.weldType === "deform") {
        anchor.updateMatrixWorld(true);

        const memberBody = this.physicsBodies.get(memberId);
        const anchorBody = this.physicsBodies.get(weld.anchorId);

        if (memberBody) {
          const relativeVelocity = memberBody.velocity.clone().sub(anchorBody?.velocity ?? new THREE.Vector3());
          const impactSpeed = relativeVelocity.length();
          const impactThreshold = 2;

          if (impactSpeed > impactThreshold) {
            const worldDirection = relativeVelocity.normalize();
            const anchorInverse = new THREE.Matrix4().copy(anchor.matrixWorld).invert();
            const localDirection = worldDirection.transformDirection(anchorInverse);
            const deformationGain = ((impactSpeed - impactThreshold) * 0.02) / Math.max(0.1, weld.durability ?? 1);
            weld.deformOffset.addScaledVector(localDirection, deformationGain);
          }
        }

        const maxDeformation = Math.max(0, weld.maxDeformation ?? 0);
        if (weld.deformOffset.length() > maxDeformation && maxDeformation > 0) {
          weld.deformOffset.setLength(maxDeformation);
        }

        const recoveryFactor = clamp((weld.recovery ?? 0.08) * (weld.durability ?? 1) * delta * 60, 0, 1);
        if (recoveryFactor > 0) {
          weld.deformOffset.multiplyScalar(1 - recoveryFactor);
        }

        const targetLocalPosition = weld.baseLocalPosition.clone().add(weld.deformOffset);
        const targetLocalMatrix = new THREE.Matrix4().compose(
          targetLocalPosition,
          weld.baseLocalQuaternion,
          weld.baseLocalScale
        );

        const targetWorldMatrix = new THREE.Matrix4().multiplyMatrices(anchor.matrixWorld, targetLocalMatrix);
        const targetWorldPosition = new THREE.Vector3();
        const targetWorldQuaternion = new THREE.Quaternion();
        const targetWorldScale = new THREE.Vector3();
        targetWorldMatrix.decompose(targetWorldPosition, targetWorldQuaternion, targetWorldScale);

        const currentAnchorPosition = new THREE.Vector3();
        anchor.getWorldPosition(currentAnchorPosition);
        const direction = targetWorldPosition.clone().sub(currentAnchorPosition);
        const currentLength = direction.length();
        const minLength = Math.max(0, weld.minLength ?? 0);

        if (currentLength < minLength) {
          if (currentLength < 1e-6) {
            direction.set(1, 0, 0);
          } else {
            direction.normalize();
          }

          const clampedWorldPosition = currentAnchorPosition.clone().addScaledVector(direction, minLength);
          const clampedLocalPosition = anchor.worldToLocal(clampedWorldPosition.clone());
          weld.deformOffset.copy(clampedLocalPosition.sub(weld.baseLocalPosition));

          targetLocalPosition.copy(weld.baseLocalPosition).add(weld.deformOffset);
          targetLocalMatrix.compose(targetLocalPosition, weld.baseLocalQuaternion, weld.baseLocalScale);
          targetWorldMatrix.multiplyMatrices(anchor.matrixWorld, targetLocalMatrix);
          targetWorldMatrix.decompose(targetWorldPosition, targetWorldQuaternion, targetWorldScale);
        }

        member.position.copy(targetWorldPosition);
        member.quaternion.copy(targetWorldQuaternion);
        member.scale.copy(targetWorldScale);
        continue;
      }

      this.welds.delete(weldId);
    }
  }

  start() {
    if (this._isRunning) {
      return;
    }

    this._isRunning = true;

    const tick = () => {
      if (!this._isRunning) {
        return;
      }

      const delta = this.clock.getDelta();

      this._stepPhysics(delta);
      this._updateWelds(delta);
      this._updateStretchPlanes();
      this._updateSunDirectionBinding();
      this._updateInterfaces();
      this._updateSounds();
      this._updateHoverState();
      this.updateCallbacks.forEach((callback) => callback(delta));

      this.renderer.render(this.scene, this.camera);
      this._raf = window.requestAnimationFrame(tick);
    };

    tick();
  }

  stop() {
    this._isRunning = false;
    if (this._raf) {
      window.cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    this.renderer.domElement.removeEventListener("pointermove", this._onPointerMove);

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    this.objects.clear();
    this.lights.clear();
    this.physicsBodies.clear();
    this.welds.clear();
    this.stretchPlanes.clear();
    this.sounds.forEach((sound) => this._cleanupSound(sound));
    this.sounds.clear();
    this.interfaces.forEach((iface) => this._cleanupInterface(iface));
    this.interfaces.clear();
    this.meshesForPicking.length = 0;
    this.updateCallbacks.clear();
    this.sunDirectionBinding = null;

    if (this.interfaceLayer?.parentElement) {
      this.interfaceLayer.parentElement.removeChild(this.interfaceLayer);
    }
  }

  onUpdate(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  resize() {
    const containerWidth = this.container.clientWidth || window.innerWidth;
    const containerHeight = this.container.clientHeight || window.innerHeight;
    const renderWidth = normalizePositiveInteger(this.renderSettings.renderWidth, containerWidth);
    const renderHeight = normalizePositiveInteger(this.renderSettings.renderHeight, containerHeight);

    this.camera.aspect = renderWidth / renderHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(renderWidth, renderHeight, false);

    this.container.style.background = this.renderSettings.letterboxColor;

    let displayWidth = this.renderSettings.displayWidth;
    let displayHeight = this.renderSettings.displayHeight;

    if (displayWidth === undefined || displayHeight === undefined) {
      if (this.renderSettings.displayMode === "fit") {
        const scale = Math.min(containerWidth / renderWidth, containerHeight / renderHeight);
        displayWidth = Math.max(1, Math.round(renderWidth * scale));
        displayHeight = Math.max(1, Math.round(renderHeight * scale));
      } else {
        displayWidth = containerWidth;
        displayHeight = containerHeight;
      }
    }

    const clampedDisplayWidth = normalizePositiveInteger(displayWidth, containerWidth);
    const clampedDisplayHeight = normalizePositiveInteger(displayHeight, containerHeight);
    const offsetX = Math.round((containerWidth - clampedDisplayWidth) / 2);
    const offsetY = Math.round((containerHeight - clampedDisplayHeight) / 2);

    this.renderer.domElement.style.left = `${offsetX}px`;
    this.renderer.domElement.style.top = `${offsetY}px`;
    this.renderer.domElement.style.width = `${clampedDisplayWidth}px`;
    this.renderer.domElement.style.height = `${clampedDisplayHeight}px`;

    this.interfaceLayer.style.left = `${offsetX}px`;
    this.interfaceLayer.style.top = `${offsetY}px`;
    this.interfaceLayer.style.width = `${clampedDisplayWidth}px`;
    this.interfaceLayer.style.height = `${clampedDisplayHeight}px`;
  }

  setRenderResolution(width, height) {
    this.renderSettings.renderWidth = normalizePositiveInteger(width, this.renderSettings.renderWidth ?? 1);
    this.renderSettings.renderHeight = normalizePositiveInteger(height, this.renderSettings.renderHeight ?? 1);
    this.resize();
  }

  setDisplayResolution(width, height) {
    this.renderSettings.displayWidth = normalizePositiveInteger(width, this.renderSettings.displayWidth ?? 1);
    this.renderSettings.displayHeight = normalizePositiveInteger(height, this.renderSettings.displayHeight ?? 1);
    this.resize();
  }

  clearDisplayResolution() {
    this.renderSettings.displayWidth = undefined;
    this.renderSettings.displayHeight = undefined;
    this.resize();
  }

  setRenderScaleMode(mode = "stretch") {
    this.renderSettings.displayMode = normalizeRenderScaleMode(mode);
    this.resize();
  }

  setLetterboxColor(color = "#000000") {
    this.renderSettings.letterboxColor = color;
    this.container.style.background = color;
  }

  getRenderSettings() {
    return {
      renderWidth: this.renderSettings.renderWidth,
      renderHeight: this.renderSettings.renderHeight,
      displayWidth: this.renderSettings.displayWidth,
      displayHeight: this.renderSettings.displayHeight,
      displayMode: this.renderSettings.displayMode,
      letterboxColor: this.renderSettings.letterboxColor
    };
  }

  createBox(options = {}) {
    const geometry = new THREE.BoxGeometry(
      options.width ?? 1,
      options.height ?? 1,
      options.depth ?? 1
    );
    const mesh = new THREE.Mesh(geometry, makeMaterial(this, options));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, options);
    return this._registerObject(mesh, options.id);
  }

  createSphere(options = {}) {
    const geometry = new THREE.SphereGeometry(
      options.radius ?? 0.5,
      options.widthSegments ?? 24,
      options.heightSegments ?? 16
    );
    const mesh = new THREE.Mesh(geometry, makeMaterial(this, options));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, options);
    return this._registerObject(mesh, options.id);
  }

  createCylinder(options = {}) {
    const geometry = new THREE.CylinderGeometry(
      options.radiusTop ?? 0.5,
      options.radiusBottom ?? 0.5,
      options.height ?? 1,
      options.radialSegments ?? 24
    );
    const mesh = new THREE.Mesh(geometry, makeMaterial(this, options));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, options);
    return this._registerObject(mesh, options.id);
  }

  createPlane(options = {}) {
    const geometry = new THREE.PlaneGeometry(options.width ?? 4, options.height ?? 4);
    const mesh = new THREE.Mesh(geometry, makeMaterial(this, options));
    mesh.receiveShadow = true;
    applyTransform(mesh, options);
    return this._registerObject(mesh, options.id);
  }

  createPoint(options = {}) {
    const point = new THREE.Object3D();
    point.visible = options.visible ?? false;
    point.userData.collisionMode = "none";
    applyTransform(point, options);
    return this._registerObject(point, options.id, options.pickable ?? false);
  }

  createCollisionPoint(options = {}) {
    const geometry = new THREE.SphereGeometry(
      options.radius ?? 0.15,
      options.widthSegments ?? 16,
      options.heightSegments ?? 12
    );
    const mesh = new THREE.Mesh(geometry, makeMaterial(this, options));
    mesh.visible = options.visible ?? false;
    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? false;
    mesh.userData.collisionMode = normalizeCollisionMode(options.collisionMode ?? "simple");
    mesh.userData.collisionThickness = normalizeCollisionThickness(options.collisionThickness, 0);
    applyTransform(mesh, options);
    return this._registerObject(mesh, options.id, options.pickable ?? false);
  }

  createStretchPlane(points = [], options = {}) {
    const pointIds = this._resolveObjectIds(points);
    if (pointIds.length < 2) {
      return null;
    }

    const material = new THREE.MeshStandardMaterial({
      color: toThreeColor(options.color ?? this.defaultObjectColor),
      side: THREE.DoubleSide,
      transparent: (options.opacity ?? 1) < 1,
      opacity: clamp(options.opacity ?? 1, 0, 1),
      roughness: options.roughness ?? 0.85,
      metalness: options.metalness ?? 0.05
    });

    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? true;
    mesh.userData.collisionMode = normalizeCollisionMode(options.collisionMode ?? "simple");
    mesh.userData.collisionThickness = normalizeCollisionThickness(options.collisionThickness, 0.05);
    const registered = this._registerObject(mesh, options.id, options.pickable ?? true);

    const descriptorId = registered.userData.polygonalId;
    this.stretchPlanes.set(descriptorId, {
      id: descriptorId,
      objectId: descriptorId,
      pointIds,
      options: {
        width: options.width ?? 0.35,
        normal: options.normal
      }
    });

    this._updateStretchPlanes();
    return registered;
  }

  async importOBJ(url, options = {}) {
    const object = await this.objLoader.loadAsync(url);

    object.traverse((child) => {
      if (child.isMesh) {
        if (!child.material || options.recolorChildren) {
          child.material = makeMaterial(this, options);
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    applyTransform(object, options);
    return this._registerObject(object, options.id);
  }

  removeObject(target) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    this.disableObjectOutline(object);

    this.scene.remove(object);
    this.objects.delete(object.userData.polygonalId);
    this.physicsBodies.delete(object.userData.polygonalId);
    this._detachObjectFromWelds(object.userData.polygonalId);
    this._detachObjectFromStretchPlanes(object.userData.polygonalId);
    this.interfaces.forEach((iface) => {
      const targetId = this._resolveObjectId(iface.target);
      if (targetId && targetId === object.userData.polygonalId) {
        iface.target = null;
      }
    });
    this.meshesForPicking = this.meshesForPicking.filter((entry) => entry !== object);

    if (this._hoveredObject === object) {
      this._hoveredObject = null;
    }

    return true;
  }

  moveObjectTo(target, x, y, z) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.position.set(x, y, z);
    return true;
  }

  moveObjectBy(target, dx = 0, dy = 0, dz = 0) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.position.add(toVector3(dx, dy, dz));
    return true;
  }

  scaleObjectTo(target, x = 1, y = 1, z = 1) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.scale.set(x, y, z);
    return true;
  }

  scaleObjectBy(target, sx = 1, sy = 1, sz = 1) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.scale.set(object.scale.x * sx, object.scale.y * sy, object.scale.z * sz);
    return true;
  }

  rotateObjectTo(target, x = 0, y = 0, z = 0) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.rotation.set(degToRad(x), degToRad(y), degToRad(z));
    return true;
  }

  rotateObjectBy(target, dx = 0, dy = 0, dz = 0) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.rotation.x += degToRad(dx);
    object.rotation.y += degToRad(dy);
    object.rotation.z += degToRad(dz);
    return true;
  }

  setObjectColor(target, color) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.traverse((child) => {
      if (child.isMesh && child.material?.color) {
        child.material.color = toThreeColor(color);
      }
    });

    return true;
  }

  setObjectTexture(target, textureUrl) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    const texture = this.textureLoader.load(textureUrl);

    object.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.map = texture;
        child.material.needsUpdate = true;
      }
    });

    return true;
  }

  setObjectTransparency(target, transparency = 0) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    const opacity = 1 - clamp(transparency, 0, 1);

    object.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = opacity < 1;
        child.material.opacity = opacity;
        child.material.needsUpdate = true;
      }
    });

    return true;
  }

  setObjectReflectance(target, reflectance = 0) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    const clamped = clamp(reflectance, 0, 1);

    object.traverse((child) => {
      if (child.isMesh && child.material) {
        if ("metalness" in child.material) {
          child.material.metalness = clamped;
        }
        if ("roughness" in child.material) {
          child.material.roughness = 1 - clamped;
        }
        child.material.needsUpdate = true;
      }
    });

    return true;
  }

  setObjectCollisionMode(target, mode = "simple") {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.userData.collisionMode = normalizeCollisionMode(mode);
    return true;
  }

  enableObjectOutline(target, options = {}) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    this.disableObjectOutline(object);

    const outlineRoot = new THREE.Group();
    outlineRoot.userData.isPolygonalOutline = true;

    object.traverse((child) => {
      if (!child.isMesh || !child.geometry) {
        return;
      }

      const edges = new THREE.EdgesGeometry(child.geometry, options.thresholdAngle ?? 1);
      const material = new THREE.LineBasicMaterial({
        color: toThreeColor(options.color ?? "#ffffff"),
        transparent: true,
        opacity: clamp(options.opacity ?? 1, 0, 1)
      });

      if (options.linewidth !== undefined) {
        material.linewidth = options.linewidth;
      }

      const lines = new THREE.LineSegments(edges, material);
      lines.position.copy(child.position);
      lines.rotation.copy(child.rotation);
      lines.scale.copy(child.scale);
      outlineRoot.add(lines);
    });

    object.userData.outlineRoot = outlineRoot;
    object.add(outlineRoot);
    return true;
  }

  disableObjectOutline(target) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    const outlineRoot = object.userData.outlineRoot;
    if (!outlineRoot) {
      return false;
    }

    outlineRoot.traverse((entry) => {
      if (entry.geometry) {
        entry.geometry.dispose?.();
      }
      if (entry.material) {
        entry.material.dispose?.();
      }
    });

    object.remove(outlineRoot);
    object.userData.outlineRoot = null;
    return true;
  }

  getDistanceBetweenObjects(targetA, targetB) {
    const a = this._resolveObject(targetA);
    const b = this._resolveObject(targetB);

    if (!a || !b) {
      return null;
    }

    const aPosition = new THREE.Vector3();
    const bPosition = new THREE.Vector3();
    a.getWorldPosition(aPosition);
    b.getWorldPosition(bPosition);
    return aPosition.distanceTo(bPosition);
  }

  getObjectsUnderCursor() {
    return [...this._hoveredObjects];
  }

  getObject(target) {
    return this._resolveObject(target);
  }

  enablePhysics(target, options = {}) {
    const objectId = this._resolveObjectId(target);
    if (!objectId) {
      return false;
    }

    const current = this.physicsBodies.get(objectId) ?? {
      velocity: new THREE.Vector3(0, 0, 0),
      mass: 1,
      useGravity: true,
      bounciness: 0.2,
      damping: 0.99,
      isKinematic: false,
      enabled: true
    };

    current.enabled = options.enabled ?? true;
    current.mass = Math.max(0.0001, options.mass ?? current.mass);
    current.useGravity = options.useGravity ?? current.useGravity;
    current.bounciness = Math.min(1, Math.max(0, options.bounciness ?? current.bounciness));
    current.damping = Math.min(1, Math.max(0, options.damping ?? current.damping));
    current.isKinematic = options.isKinematic ?? current.isKinematic;

    if (options.vx !== undefined || options.vy !== undefined || options.vz !== undefined) {
      current.velocity.set(
        options.vx ?? current.velocity.x,
        options.vy ?? current.velocity.y,
        options.vz ?? current.velocity.z
      );
    }

    this.physicsBodies.set(objectId, current);
    return true;
  }

  disablePhysics(target) {
    const objectId = this._resolveObjectId(target);
    if (!objectId) {
      return false;
    }

    return this.physicsBodies.delete(objectId);
  }

  setPhysicsVelocity(target, vx = 0, vy = 0, vz = 0) {
    const objectId = this._resolveObjectId(target);
    if (!objectId) {
      return false;
    }

    const body = this.physicsBodies.get(objectId);
    if (!body) {
      return false;
    }

    body.velocity.set(vx, vy, vz);
    return true;
  }

  addForce(target, fx = 0, fy = 0, fz = 0) {
    const objectId = this._resolveObjectId(target);
    if (!objectId) {
      return false;
    }

    const body = this.physicsBodies.get(objectId);
    if (!body) {
      return false;
    }

    body.velocity.x += fx / body.mass;
    body.velocity.y += fy / body.mass;
    body.velocity.z += fz / body.mass;
    return true;
  }

  setGravity(x = 0, y = -9.81, z = 0) {
    this.physics.gravity.set(x, y, z);
  }

  setPhysicsFloor(y) {
    this.physics.floorY = y;
  }

  clearPhysicsFloor() {
    this.physics.floorY = null;
  }

  createGroup(targets = [], options = {}) {
    const resolvedObjects = [...new Set(targets.map((target) => this._resolveObject(target)).filter(Boolean))];

    if (resolvedObjects.length < 2) {
      return null;
    }

    const anchor = options.primary ? this._resolveObject(options.primary) : resolvedObjects[0];
    if (!anchor) {
      return null;
    }

    const anchorId = anchor.userData.polygonalId;
    const memberIds = resolvedObjects
      .map((object) => object.userData.polygonalId)
      .filter((id) => id !== anchorId);

    if (memberIds.length === 0) {
      return null;
    }

    anchor.updateMatrixWorld(true);
    const anchorInverse = new THREE.Matrix4().copy(anchor.matrixWorld).invert();
    const offsets = new Map();

    for (const memberId of memberIds) {
      const member = this.objects.get(memberId);
      if (!member) {
        continue;
      }

      member.updateMatrixWorld(true);
      const offset = new THREE.Matrix4().multiplyMatrices(anchorInverse, member.matrixWorld);
      offsets.set(memberId, offset);
    }

    const weldId = options.id ?? nextId("group");
    this.welds.set(weldId, {
      id: weldId,
      weldType: "group",
      anchorId,
      memberIds,
      offsets
    });

    return weldId;
  }

  setGroupPrimary(groupId, target) {
    const weld = this.welds.get(groupId);
    const nextPrimary = this._resolveObject(target);

    if (!weld || weld.weldType !== "group" || !nextPrimary) {
      return false;
    }

    const nextPrimaryId = nextPrimary.userData.polygonalId;
    if (nextPrimaryId !== weld.anchorId && !weld.memberIds.includes(nextPrimaryId)) {
      return false;
    }

    const groupIds = [weld.anchorId, ...weld.memberIds];
    const uniqueIds = [...new Set(groupIds)];

    nextPrimary.updateMatrixWorld(true);
    const primaryInverse = new THREE.Matrix4().copy(nextPrimary.matrixWorld).invert();
    const offsets = new Map();

    for (const memberId of uniqueIds) {
      if (memberId === nextPrimaryId) {
        continue;
      }

      const member = this.objects.get(memberId);
      if (!member) {
        continue;
      }

      member.updateMatrixWorld(true);
      offsets.set(memberId, new THREE.Matrix4().multiplyMatrices(primaryInverse, member.matrixWorld));
    }

    weld.anchorId = nextPrimaryId;
    weld.memberIds = [...offsets.keys()];
    weld.offsets = offsets;
    return true;
  }

  moveGroupBy(groupId, dx = 0, dy = 0, dz = 0) {
    const weld = this.welds.get(groupId);
    if (!weld || weld.weldType !== "group") {
      return false;
    }

    return this.moveObjectBy(weld.anchorId, dx, dy, dz);
  }

  rotateGroupBy(groupId, dx = 0, dy = 0, dz = 0) {
    const weld = this.welds.get(groupId);
    if (!weld || weld.weldType !== "group") {
      return false;
    }

    return this.rotateObjectBy(weld.anchorId, dx, dy, dz);
  }

  getGroup(groupId) {
    const weld = this.welds.get(groupId);
    if (!weld || weld.weldType !== "group") {
      return null;
    }

    return {
      id: weld.id,
      primaryId: weld.anchorId,
      memberIds: weld.memberIds
    };
  }

  removeGroup(groupId) {
    const weld = this.welds.get(groupId);
    if (!weld || weld.weldType !== "group") {
      return false;
    }

    return this.welds.delete(groupId);
  }

  createSpringWeld(anchorTarget, memberTarget, options = {}) {
    return this._createDistanceWeld("spring", anchorTarget, memberTarget, options);
  }

  createRopeWeld(anchorTarget, memberTarget, options = {}) {
    return this._createDistanceWeld("rope", anchorTarget, memberTarget, options);
  }

  createElasticWeld(anchorTarget, memberTarget, options = {}) {
    return this._createDistanceWeld("elastic", anchorTarget, memberTarget, options);
  }

  createDeformWeld(anchorTarget, memberTarget, options = {}) {
    return this._createDeformWeld(anchorTarget, memberTarget, options);
  }

  getWeld(weldId) {
    const weld = this.welds.get(weldId);
    if (!weld || weld.weldType === "group") {
      return null;
    }

    const info = {
      id: weld.id,
      type: weld.weldType,
      anchorId: weld.anchorId,
      memberId: weld.memberIds?.[0] ?? null
    };

    if (weld.weldType === "rope") {
      info.length = weld.maxLength ?? weld.length ?? 0;
      info.minLength = weld.minLength ?? 0;
      info.maxLength = weld.maxLength ?? weld.length ?? 0;
    }

    if (weld.weldType === "spring" || weld.weldType === "elastic") {
      info.minLength = weld.minLength ?? 0;
      info.maxLength = weld.maxLength ?? 0;
      info.elasticity = weld.elasticity ?? 0;
    }

    if (weld.weldType === "elastic") {
      info.slack = weld.slack ?? 0;
    }

    if (weld.weldType === "deform") {
      info.minLength = weld.minLength ?? 0;
      info.durability = weld.durability ?? 0;
      info.deformation = weld.deformOffset?.length?.() ?? 0;
    }

    return info;
  }

  removeWeld(weldId) {
    const weld = this.welds.get(weldId);
    if (!weld || weld.weldType === "group") {
      return false;
    }

    return this.welds.delete(weldId);
  }

  checkCollision(targetA, targetB) {
    const a = this._resolveObject(targetA);
    const b = this._resolveObject(targetB);

    if (!a || !b) {
      return false;
    }

    return this._hasCollisionBetween(a, b);
  }

  createGlobalSound(url, options = {}) {
    const soundId = options.id ?? nextId("sound");
    const audio = new Audio(url);
    audio.loop = options.loop ?? false;
    audio.volume = clamp(options.volume ?? 1, 0, 1);

    const sound = {
      id: soundId,
      kind: "global",
      audio,
      baseVolume: audio.volume,
      range: options.range ?? 15,
      target: null,
      x: 0,
      y: 0,
      z: 0
    };

    this.sounds.set(soundId, sound);
    if (options.autoplay) {
      audio.play().catch(() => {});
    }

    return soundId;
  }

  createLocalSound(url, options = {}) {
    const soundId = options.id ?? nextId("sound");
    const audio = new Audio(url);
    audio.loop = options.loop ?? false;
    audio.volume = clamp(options.volume ?? 1, 0, 1);

    const sound = {
      id: soundId,
      kind: "local",
      audio,
      baseVolume: audio.volume,
      range: options.range ?? 15,
      target: options.target ?? null,
      x: options.x ?? 0,
      y: options.y ?? 0,
      z: options.z ?? 0
    };

    this.sounds.set(soundId, sound);
    if (options.autoplay) {
      audio.play().catch(() => {});
    }

    return soundId;
  }

  playSound(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return false;
    }

    sound.audio.play().catch(() => {});
    return true;
  }

  pauseSound(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return false;
    }

    sound.audio.pause();
    return true;
  }

  stopSound(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return false;
    }

    sound.audio.pause();
    sound.audio.currentTime = 0;
    return true;
  }

  setSoundVolume(soundId, volume) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return false;
    }

    const clamped = clamp(volume, 0, 1);
    sound.baseVolume = clamped;
    sound.audio.volume = clamped;
    return true;
  }

  setLocalSoundPosition(soundId, x = 0, y = 0, z = 0) {
    const sound = this.sounds.get(soundId);
    if (!sound || sound.kind !== "local") {
      return false;
    }

    sound.target = null;
    sound.x = x;
    sound.y = y;
    sound.z = z;
    return true;
  }

  attachSoundToObject(soundId, target) {
    const sound = this.sounds.get(soundId);
    const objectId = this._resolveObjectId(target);

    if (!sound || sound.kind !== "local" || !objectId) {
      return false;
    }

    sound.target = objectId;
    return true;
  }

  removeSound(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return false;
    }

    this._cleanupSound(sound);
    return this.sounds.delete(soundId);
  }

  getSound(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return null;
    }

    return {
      id: sound.id,
      kind: sound.kind,
      volume: sound.baseVolume,
      range: sound.range,
      target: sound.target,
      x: sound.x,
      y: sound.y,
      z: sound.z
    };
  }

  createInterface(options = {}) {
    const interfaceMode = options.mode === "surface" || options.mode === "overlay" ? options.mode : "overlay";
    const backgroundMode = options.backgroundMode ?? (interfaceMode === "overlay" && options.mode !== "overlay" ? options.mode : undefined);

    const id = options.id ?? nextId("ui");
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.left = "0";
    element.style.top = "0";
    element.style.transformOrigin = "center";
    const clickable = options.clickable ?? false;
    element.style.pointerEvents = clickable ? "auto" : "none";
    element.style.display = "block";
    element.style.zIndex = String(options.layer ?? 0);

    if (options.background) {
      element.style.background = options.background;
      if (backgroundMode) {
        applyInterfaceBackgroundPresentation(element, {
          mode: backgroundMode,
          tileSize: options.tileSize,
          tileWidth: options.tileWidth,
          tileHeight: options.tileHeight,
          tileOffsetX: options.tileOffsetX,
          tileOffsetY: options.tileOffsetY,
          alignX: options.alignX,
          alignY: options.alignY
        });
      }
    }

    const content = document.createElement("div");
    content.style.width = "100%";
    content.style.height = "100%";
    content.style.position = "relative";
    content.style.overflow = "hidden";

    element.appendChild(content);
    this.interfaceLayer.appendChild(element);

    this.interfaces.set(id, {
      id,
      element,
      content,
      objects: new Map(),
      clickable,
      clickHandlers: new Set(),
      alignX: options.alignX ?? "center",
      alignY: options.alignY ?? "center",
      color: options.color ?? "#ffffff",
      fontSize: options.fontSize ?? 16,
      layer: options.layer ?? 0,
      mode: interfaceMode,
      target: options.target ?? null,
      localX: options.localX ?? 0,
      localY: options.localY ?? 0,
      localZ: options.localZ ?? 0,
      x: options.x ?? this.renderer.domElement.clientWidth / 2,
      y: options.y ?? this.renderer.domElement.clientHeight / 2,
      width: options.width ?? 160,
      height: options.height ?? 60,
      rotation: options.rotation ?? 0,
      scaleX: options.scaleX ?? 1,
      scaleY: options.scaleY ?? 1,
      opacity: options.opacity ?? 1
    });

    if (options.svg) {
      this.setInterfaceSVG(id, options.svg);
    } else if (options.text !== undefined) {
      this.setInterfaceText(id, options.text);
    }

    if (typeof options.onClick === "function") {
      this.onInterfaceClick(id, options.onClick);
    }

    return id;
  }

  removeInterface(interfaceId) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    this._cleanupInterface(iface);
    return this.interfaces.delete(interfaceId);
  }

  setInterfaceText(interfaceId, text) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const legacyId = "__legacy_content";
    let descriptor = iface.objects.get(legacyId);

    if (!descriptor) {
      const element = document.createElement("div");
      element.style.position = "absolute";
      element.style.left = "50%";
      element.style.top = "50%";
      element.style.transform = "translate(-50%, -50%)";
      element.style.display = "flex";
      element.style.alignItems = iface.alignY;
      element.style.justifyContent = iface.alignX;
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.textAlign = "center";
      element.style.pointerEvents = "none";
      iface.content.appendChild(element);
      descriptor = { id: legacyId, type: "text", element };
      iface.objects.set(legacyId, descriptor);
    }

    descriptor.type = "text";
    descriptor.element.innerHTML = "";
    descriptor.element.textContent = text;
    descriptor.element.style.color = iface.color;
    descriptor.element.style.fontSize = `${iface.fontSize}px`;
    return true;
  }

  setInterfaceSVG(interfaceId, svgMarkup) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const legacyId = "__legacy_content";
    let descriptor = iface.objects.get(legacyId);

    if (!descriptor) {
      const element = document.createElement("div");
      element.style.position = "absolute";
      element.style.left = "50%";
      element.style.top = "50%";
      element.style.transform = "translate(-50%, -50%)";
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.pointerEvents = "none";
      iface.content.appendChild(element);
      descriptor = { id: legacyId, type: "svg", element };
      iface.objects.set(legacyId, descriptor);
    }

    descriptor.type = "svg";
    descriptor.element.innerHTML = svgMarkup;
    return true;
  }

  createInterfaceText(interfaceId, options = {}) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return null;
    }

    const objectId = options.id ?? nextId("ui_text");
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.left = `${options.x ?? 0}px`;
    element.style.top = `${options.y ?? 0}px`;
    element.style.width = options.width !== undefined ? `${options.width}px` : "auto";
    element.style.height = options.height !== undefined ? `${options.height}px` : "auto";
    element.style.color = options.color ?? iface.color;
    element.style.fontSize = `${options.fontSize ?? iface.fontSize}px`;
    element.style.fontWeight = options.fontWeight ?? "normal";
    element.style.textAlign = options.align ?? "left";
    element.style.pointerEvents = options.clickable ? "auto" : "none";
    element.textContent = options.text ?? "";

    iface.content.appendChild(element);
    iface.objects.set(objectId, {
      id: objectId,
      type: "text",
      element
    });

    return objectId;
  }

  createInterfaceImage(interfaceId, options = {}) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return null;
    }

    const objectId = options.id ?? nextId("ui_image");
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.left = `${options.x ?? 0}px`;
    element.style.top = `${options.y ?? 0}px`;
    element.style.width = `${options.width ?? 64}px`;
    element.style.height = `${options.height ?? 64}px`;
    element.style.backgroundPosition = "center";
    element.style.pointerEvents = options.clickable ? "auto" : "none";

    const imageOptions = {
      src: options.src,
      mode: options.mode ?? options.fit ?? "fit",
      fit: options.fit,
      tileSize: options.tileSize,
      tileWidth: options.tileWidth,
      tileHeight: options.tileHeight,
      tileOffsetX: options.tileOffsetX,
      tileOffsetY: options.tileOffsetY,
      alignX: options.alignX,
      alignY: options.alignY
    };
    applyInterfaceImagePresentation(element, imageOptions);

    iface.content.appendChild(element);
    iface.objects.set(objectId, {
      id: objectId,
      type: "image",
      element,
      imageOptions
    });

    return objectId;
  }

  setInterfaceObjectText(interfaceId, objectId, text) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const descriptor = iface.objects.get(objectId);
    if (!descriptor || descriptor.type !== "text") {
      return false;
    }

    descriptor.element.textContent = text;
    return true;
  }

  setInterfaceObjectImage(interfaceId, objectId, src) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const descriptor = iface.objects.get(objectId);
    if (!descriptor || descriptor.type !== "image") {
      return false;
    }

    descriptor.imageOptions = {
      ...(descriptor.imageOptions ?? {}),
      src
    };
    applyInterfaceImagePresentation(descriptor.element, descriptor.imageOptions);
    return true;
  }

  setInterfaceObjectImageMode(interfaceId, objectId, mode = "fit") {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const descriptor = iface.objects.get(objectId);
    if (!descriptor || descriptor.type !== "image") {
      return false;
    }

    descriptor.imageOptions = {
      ...(descriptor.imageOptions ?? {}),
      mode: normalizeImageMode(mode)
    };
    applyInterfaceImagePresentation(descriptor.element, descriptor.imageOptions);
    return true;
  }

  setInterfaceObjectImageTiling(interfaceId, objectId, options = {}) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const descriptor = iface.objects.get(objectId);
    if (!descriptor || descriptor.type !== "image") {
      return false;
    }

    descriptor.imageOptions = {
      ...(descriptor.imageOptions ?? {}),
      tileSize: options.tileSize,
      tileWidth: options.tileWidth,
      tileHeight: options.tileHeight,
      tileOffsetX: options.tileOffsetX,
      tileOffsetY: options.tileOffsetY,
      alignX: options.alignX,
      alignY: options.alignY
    };
    applyInterfaceImagePresentation(descriptor.element, descriptor.imageOptions);
    return true;
  }

  removeInterfaceObject(interfaceId, objectId) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    const descriptor = iface.objects.get(objectId);
    if (!descriptor) {
      return false;
    }

    descriptor.element.remove();
    iface.objects.delete(objectId);
    return true;
  }

  setInterfaceMode(interfaceId, mode = "overlay") {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.mode = mode === "surface" ? "surface" : "overlay";
    return true;
  }

  setInterfaceLayer(interfaceId, layer = 0) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.layer = layer;
    iface.element.style.zIndex = String(layer);
    return true;
  }

  setInterfaceClickable(interfaceId, clickable = true) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.clickable = clickable;
    iface.element.style.pointerEvents = clickable ? "auto" : "none";
    return true;
  }

  onInterfaceClick(interfaceId, handler) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface || typeof handler !== "function") {
      return () => {};
    }

    const wrapped = (event) => {
      handler({
        id: interfaceId,
        x: event.clientX,
        y: event.clientY,
        target: iface.target,
        mode: iface.mode,
        originalEvent: event
      });
    };

    iface.clickHandlers.add({ handler, wrapped });
    iface.element.addEventListener("click", wrapped);

    return () => {
      iface.element.removeEventListener("click", wrapped);

      for (const entry of iface.clickHandlers) {
        if (entry.handler === handler && entry.wrapped === wrapped) {
          iface.clickHandlers.delete(entry);
          break;
        }
      }
    };
  }

  attachInterfaceToObject(interfaceId, target, options = {}) {
    const iface = this.interfaces.get(interfaceId);
    const targetId = this._resolveObjectId(target);

    if (!iface || !targetId) {
      return false;
    }

    iface.mode = "surface";
    iface.target = targetId;
    iface.localX = options.localX ?? iface.localX;
    iface.localY = options.localY ?? iface.localY;
    iface.localZ = options.localZ ?? iface.localZ;
    return true;
  }

  setInterfaceScreenPosition(interfaceId, x, y) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.mode = "overlay";
    iface.x = x;
    iface.y = y;
    return true;
  }

  moveInterfaceBy(interfaceId, dx = 0, dy = 0) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.x += dx;
    iface.y += dy;
    return true;
  }

  resizeInterface(interfaceId, width, height) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.width = width;
    iface.height = height;
    return true;
  }

  stretchInterface(interfaceId, scaleX = 1, scaleY = 1) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.scaleX = scaleX;
    iface.scaleY = scaleY;
    return true;
  }

  rotateInterface(interfaceId, radians = 0) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.rotation = radians;
    return true;
  }

  setInterfaceTransparency(interfaceId, transparency = 0) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return false;
    }

    iface.opacity = 1 - clamp(transparency, 0, 1);
    return true;
  }

  getInterface(interfaceId) {
    const iface = this.interfaces.get(interfaceId);
    if (!iface) {
      return null;
    }

    return {
      id: iface.id,
      mode: iface.mode,
      target: iface.target,
      x: iface.x,
      y: iface.y,
      width: iface.width,
      height: iface.height,
      rotation: iface.rotation,
      scaleX: iface.scaleX,
      scaleY: iface.scaleY,
      opacity: iface.opacity,
      clickable: iface.clickable,
      layer: iface.layer
    };
  }

  getHoveredObject() {
    return this._hoveredObject;
  }

  isHovering(target) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    return this._hoveredObject === object;
  }

  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }

  moveCameraBy(dx = 0, dy = 0, dz = 0) {
    this.camera.position.add(toVector3(dx, dy, dz));
  }

  rotateCameraTo(x = 0, y = 0, z = 0) {
    this.camera.rotation.set(degToRad(x), degToRad(y), degToRad(z));
  }

  lookAt(x, y, z) {
    this.camera.lookAt(toVector3(x, y, z));
  }

  setCameraFov(fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  createAmbientLight(options = {}) {
    const light = new THREE.AmbientLight(
      toThreeColor(options.color ?? "#ffffff"),
      options.brightness ?? options.intensity ?? 0.5
    );
    return this._registerLight(light, options.id);
  }

  createDirectionalLight(options = {}) {
    const light = new THREE.DirectionalLight(
      toThreeColor(options.color ?? "#ffffff"),
      options.brightness ?? options.intensity ?? 1
    );
    light.position.set(options.x ?? 0, options.y ?? 5, options.z ?? 0);
    light.castShadow = options.castShadow ?? true;
    return this._registerLight(light, options.id);
  }

  createPointLight(options = {}) {
    const light = new THREE.PointLight(
      toThreeColor(options.color ?? "#ffffff"),
      options.brightness ?? options.intensity ?? 1,
      options.range ?? options.distance ?? 40
    );
    light.position.set(options.x ?? 0, options.y ?? 2, options.z ?? 0);
    return this._registerLight(light, options.id);
  }

  createSpotLight(options = {}) {
    const light = new THREE.SpotLight(
      toThreeColor(options.color ?? "#ffffff"),
      options.brightness ?? options.intensity ?? 1,
      options.range ?? options.distance ?? 80,
      options.angle ?? Math.PI / 6,
      options.penumbra ?? 0.25
    );
    light.position.set(options.x ?? 0, options.y ?? 5, options.z ?? 0);
    if (options.targetX !== undefined || options.targetY !== undefined || options.targetZ !== undefined) {
      light.target.position.set(options.targetX ?? 0, options.targetY ?? 0, options.targetZ ?? 0);
      this.scene.add(light.target);
    }
    return this._registerLight(light, options.id);
  }

  moveLightTo(target, x, y, z) {
    const light = this._resolveLight(target);
    if (!light) {
      return false;
    }

    light.position.set(x, y, z);
    return true;
  }

  moveLightBy(target, dx = 0, dy = 0, dz = 0) {
    const light = this._resolveLight(target);
    if (!light) {
      return false;
    }

    light.position.add(toVector3(dx, dy, dz));
    return true;
  }

  setLightColor(target, color) {
    const light = this._resolveLight(target);
    if (!light) {
      return false;
    }

    light.color = toThreeColor(color);
    return true;
  }

  setLightBrightness(target, brightness) {
    const light = this._resolveLight(target);
    if (!light) {
      return false;
    }

    light.intensity = brightness;
    return true;
  }

  setLightRange(target, range) {
    const light = this._resolveLight(target);
    if (!light || light.distance === undefined) {
      return false;
    }

    light.distance = range;
    return true;
  }

  removeLight(target) {
    const light = this._resolveLight(target);
    if (!light) {
      return false;
    }

    this.scene.remove(light);
    this.lights.delete(light.userData.polygonalId);
    return true;
  }

  getLight(target) {
    return this._resolveLight(target);
  }

  setSunDirectionFromPoints(fromPoint, toPoint, options = {}) {
    const from = this._resolveObject(fromPoint);
    const to = this._resolveObject(toPoint);

    if (!from || !to) {
      return false;
    }

    const first = new THREE.Vector3();
    const second = new THREE.Vector3();
    from.getWorldPosition(first);
    to.getWorldPosition(second);

    const source = first.y >= second.y ? first : second;
    const target = first.y >= second.y ? second : first;

    const direction = new THREE.Vector3().subVectors(target, source);
    if (direction.lengthSq() < 1e-8) {
      return false;
    }

    direction.normalize();
    const distance = options.distance ?? source.distanceTo(target);
    const lightPosition = target.clone().sub(direction.multiplyScalar(distance));

    this.sunLight.position.copy(lightPosition);
    this.sunLight.target.position.copy(target);
    this.sunLight.target.updateMatrixWorld();
    return true;
  }

  bindSunDirectionToPoints(fromPoint, toPoint, options = {}) {
    if (!this.setSunDirectionFromPoints(fromPoint, toPoint, options)) {
      return false;
    }

    this.sunDirectionBinding = {
      from: fromPoint,
      to: toPoint,
      options: { ...options }
    };

    return true;
  }

  clearSunDirectionBinding() {
    this.sunDirectionBinding = null;
    return true;
  }

  setSkyColor(color) {
    this.scene.background = toThreeColor(color);
  }

  setSkyTexture(url, mapping = THREE.EquirectangularReflectionMapping) {
    const texture = this.textureLoader.load(url);
    texture.mapping = mapping;
    this.scene.background = texture;
    this.environment.skyTexture = url;
  }

  setCloudTexture(url) {
    this.environment.cloudTexture = url;
  }

  setSunColor(color) {
    this.sunLight.color = toThreeColor(color, "#fff5d6");
  }

  setMoonColor(color) {
    this.moonLight.color = toThreeColor(color, "#a4b7ff");
  }

  setSunTexture(url) {
    this.environment.sunTexture = url;
  }

  setMoonTexture(url) {
    this.environment.moonTexture = url;
  }

  setTimeOfDay(hours) {
    const normalized = ((hours % 24) + 24) % 24;
    this.environment.timeOfDay = normalized;

    const t = normalized / 24;
    const sunAngle = t * Math.PI * 2;

    this.sunLight.position.set(Math.cos(sunAngle) * 80, Math.sin(sunAngle) * 90, 30);
    this.moonLight.position.set(-Math.cos(sunAngle) * 80, -Math.sin(sunAngle) * 90, -30);

    const daylight = Math.max(0, Math.sin(sunAngle));
    this.sunLight.intensity = 0.15 + daylight * 1.25;
    this.moonLight.intensity = 0.45 - daylight * 0.4;
  }

  setFog(color, near = 5, far = 80) {
    this.scene.fog = new THREE.Fog(toThreeColor(color), near, far);
  }

  clearFog() {
    this.scene.fog = null;
  }
}

export function createScene(options = {}) {
  return new PolygonalScene(options);
}

export { PolygonalScene };
