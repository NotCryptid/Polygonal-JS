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

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-2, -2);

    this.objects = new Map();
    this.lights = new Map();
    this.physicsBodies = new Map();
    this.welds = new Map();
    this.updateCallbacks = new Set();
    this.meshesForPicking = [];

    this._hoveredObject = null;
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

    this._setupContainer();
    this._setupBaseLights();
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

    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.container.appendChild(this.renderer.domElement);
  }

  _setupBaseLights() {
    const ambient = new THREE.AmbientLight("#ffffff", 0.3);
    this.scene.add(ambient);
    this.lights.set("ambient_default", ambient);

    this.sunLight = new THREE.DirectionalLight("#fff5d6", 1.0);
    this.sunLight.position.set(40, 60, 20);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);
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
    this.objects.set(id, object);
    this.scene.add(object);

    if (pickable) {
      this.meshesForPicking.push(object);
    }

    return id;
  }

  _registerLight(light, preferredId) {
    const id = preferredId ?? nextId("light");
    light.userData.polygonalId = id;
    this.lights.set(id, light);
    this.scene.add(light);
    return id;
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
      return;
    }

    const root = intersections[0].object;
    const owner = this._findOwnedObject(root);
    this._hoveredObject = owner;
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
        if (bounds.intersectsBox(otherBounds)) {
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

  _updateWelds() {
    if (this.welds.size === 0) {
      return;
    }

    for (const [weldId, weld] of this.welds.entries()) {
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
      this._updateWelds();
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
    this.meshesForPicking.length = 0;
    this.updateCallbacks.clear();
  }

  onUpdate(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
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

    this.scene.remove(object);
    this.objects.delete(object.userData.polygonalId);
    this.physicsBodies.delete(object.userData.polygonalId);
    this._detachObjectFromWelds(object.userData.polygonalId);
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

    object.rotation.set(x, y, z);
    return true;
  }

  rotateObjectBy(target, dx = 0, dy = 0, dz = 0) {
    const object = this._resolveObject(target);
    if (!object) {
      return false;
    }

    object.rotation.x += dx;
    object.rotation.y += dy;
    object.rotation.z += dz;
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

  createWeld(targets = [], options = {}) {
    const resolvedObjects = [...new Set(targets.map((target) => this._resolveObject(target)).filter(Boolean))];

    if (resolvedObjects.length < 2) {
      return null;
    }

    const anchor = options.anchor ? this._resolveObject(options.anchor) : resolvedObjects[0];
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

    const weldId = options.id ?? nextId("weld");
    this.welds.set(weldId, {
      id: weldId,
      anchorId,
      memberIds,
      offsets
    });

    return weldId;
  }

  removeWeld(weldId) {
    return this.welds.delete(weldId);
  }

  getWeld(weldId) {
    const weld = this.welds.get(weldId);
    if (!weld) {
      return null;
    }

    return {
      id: weld.id,
      anchorId: weld.anchorId,
      memberIds: [...weld.memberIds]
    };
  }

  checkCollision(targetA, targetB) {
    const a = this._resolveObject(targetA);
    const b = this._resolveObject(targetB);

    if (!a || !b) {
      return false;
    }

    const boxA = new THREE.Box3().setFromObject(a);
    const boxB = new THREE.Box3().setFromObject(b);
    return boxA.intersectsBox(boxB);
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
    this.camera.rotation.set(x, y, z);
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

// Backward-compatible aliases
export const createWorld = createScene;
export const PolygonalWorld = PolygonalScene;
