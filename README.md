# Polygonal-JS

Simple 3D library for HTML and Electron with a Scratch/PXT-style coding flow.

## Goals

- One command to create a full-page 3D scene
- Easy object creation and manipulation
- Camera, light, collision, and hover helpers
- Support for OBJ import and PNG textures
- Simple environment controls (sky, fog, day/night)

## Install

```bash
npm install polygonal-js
```

## Quick Start (HTML)

```html
<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>Polygonal-JS Demo</title>
		<style>
			html,
			body {
				margin: 0;
				width: 100%;
				height: 100%;
				overflow: hidden;
			}
		</style>
	</head>
	<body>
		<script type="importmap">
			{
				"imports": {
					"polygonal-js": "./node_modules/polygonal-js/src/index.js",
					"three": "./node_modules/three/build/three.module.js",
					"three/examples/jsm/": "./node_modules/three/examples/jsm/"
				}
			}
		</script>
		<script type="module">
			import { createScene } from "polygonal-js";

			// One command creates a full-page empty 3D scene and starts rendering.
			const scene = createScene();

			const ground = scene.createPlane({
				width: 20,
				height: 20,
				rotationX: -Math.PI / 2,
				y: -1,
				color: "#222831"
			});

			const cube = scene.createBox({
				x: 0,
				y: 0,
				z: 0,
				color: "#44d6a7",
				texture: "./assets/crate.png"
			});

			scene.onUpdate((delta) => {
				scene.rotateObjectBy(cube, 0, 60 * delta, 0);
			});
		</script>
	</body>
</html>
```

## Quick Start (Electron Renderer)

Use this inside your renderer script (or preload-exposed renderer API):

```js
import { createScene } from "polygonal-js";

const scene = createScene();
const player = scene.createSphere({ radius: 0.75, color: "#f9ed69" });

scene.setCameraPosition(0, 2, 8);
scene.lookAt(0, 0, 0);

window.addEventListener("keydown", (event) => {
	if (event.key === "ArrowRight") player.moveObjectBy(0.15, 0, 0);
	if (event.key === "ArrowLeft") player.moveObjectBy(-0.15, 0, 0);
	if (event.key === "ArrowUp") player.moveObjectBy(0, 0, -0.15);
	if (event.key === "ArrowDown") player.moveObjectBy(0, 0, 0.15);
});
```

## API

### Create Scene

```js
const scene = createScene({
	skyColor: "#111827",
	fov: 60,
	near: 0.1,
	far: 2500,
	autoStart: true
});
```

### Object Creation

```js
const box = scene.createBox({ width: 1, height: 1, depth: 1, color: "#ff6b6b" });
const sphere = scene.createSphere({ radius: 0.5, color: "#4d96ff" });
const cylinder = scene.createCylinder({ radiusTop: 0.5, radiusBottom: 0.5, height: 2 });
const plane = scene.createPlane({ width: 20, height: 20, rotationX: -Math.PI / 2 });
const pointA = scene.createPoint({ x: -2, y: 1, z: 0 });
const pointB = scene.createPoint({ x: 2, y: 1, z: 0 });
const collisionPoint = scene.createCollisionPoint({
	x: 0,
	y: 0.5,
	z: 0,
	radius: 0.2,
	visible: true,
	color: "#ffaa5f"
});
const stretch = scene.createStretchPlane([pointA, pointB], {
	color: "#88c0ff",
	opacity: 0.6,
	width: 0.5,
	collisionMode: "simple",
	collisionThickness: 0.08
});
```

### OBJ Import

```js
const tree = await scene.importOBJ("./assets/tree.obj", {
	x: 3,
	y: 0,
	z: -5,
	recolorChildren: false
});
```

### Object Manipulation

```js
box.moveObjectTo(2, 1, -3);
box.moveObjectBy(0.1, 0, 0);

box.scaleObjectTo(2, 2, 2);
box.scaleObjectBy(1.1, 1, 1);

box.rotateObjectTo(0, 45, 0); // degrees
box.rotateObjectBy(0, 1, 0);  // degrees delta

box.setObjectColor("#00ff88");
box.setObjectTexture("./assets/metal.png");
box.setObjectTransparency(0.35);
box.setObjectReflectance(0.8);
box.setObjectCollisionMode("precise"); // none | simple | precise
box.enableObjectOutline({ color: "#ffffff", opacity: 0.9 });
box.disableObjectOutline();

box.remove();
```

### Physics

```js
player.enablePhysics({
	mass: 1,
	useGravity: true,
	bounciness: 0.25,
	damping: 0.99,
	vx: 0,
	vy: 0,
	vz: 0
});

scene.setGravity(0, -9.81, 0);
scene.setPhysicsFloor(-1);

player.addForce(5, 8, 0);
player.setPhysicsVelocity(0, 0, 0);
player.disablePhysics();
scene.clearPhysicsFloor();
```

### Groups (Bind Multiple Objects)

```js
const groupId = scene.createGroup([player, sword, shield], {
	id: "playerGear",
	primary: player
});

// Move group by moving primary directly or with helper.
scene.moveGroupBy("playerGear", 1, 0, 0);

// Change primary (center point for future group rotation).
scene.setGroupPrimary("playerGear", shield);
scene.rotateGroupBy("playerGear", 0, 22.5, 0);

const groupInfo = scene.getGroup("playerGear");
scene.removeGroup("playerGear");
```

### Welds (Spring, Rope, Elastic, Deform)

```js
const springWeld = scene.createSpringWeld(player, crate, {
	minLength: 1,
	maxLength: 4,
	elasticity: 0.25
});

const ropeWeld = scene.createRopeWeld(hook, lantern, {
	length: 6,
	minLength: 0
});

const elasticWeld = scene.createElasticWeld(hand, balloon, {
	minLength: 0.8,
	maxLength: 5,
	elasticity: 0.1,
	slack: 0.75
});

const deformWeld = scene.createDeformWeld(hinge, plate, {
	minLength: 0.4,
	durability: 1.5
});

const springInfo = scene.getWeld(springWeld);
scene.removeWeld(ropeWeld);
```

### Camera Commands

```js
scene.setCameraPosition(0, 3, 10);
scene.moveCameraBy(0, 0, -1);
scene.rotateCameraTo(0, 0, 0);
scene.lookAt(0, 0, 0);
scene.setCameraFov(75);
```

### Collision + Hover

```js
if (scene.checkCollision(player, wall)) {
	console.log("Collision detected");
}

const distance = player.distanceToObject(wall);

if (scene.isHovering(player)) {
	player.setObjectColor("#ffffff");
}

const hovered = scene.getHoveredObject();
const allUnderCursor = scene.getObjectsUnderCursor();
```

### Lights

```js
const ambient = scene.createAmbientLight({ color: "#ffffff", brightness: 0.4 });
const sun = scene.createDirectionalLight({ color: "#fff0cc", brightness: 1.1, x: 50, y: 80, z: 20 });
const lamp = scene.createPointLight({ color: "#ffddaa", brightness: 1.2, range: 30, x: 0, y: 3, z: 0 });
const spot = scene.createSpotLight({ color: "#cce7ff", brightness: 1.0, range: 60, x: 0, y: 8, z: 5 });

scene.moveLightTo(lamp, 2, 3, 1);
scene.moveLightBy(lamp, 0, 0, -1);
scene.setLightColor(lamp, "#aaffcc");
scene.setLightBrightness(lamp, 0.8);
scene.setLightRange(lamp, 40);
scene.removeLight(spot);
```

### Sounds (Global + Local)

```js
const music = scene.createGlobalSound("./assets/music.mp3", {
	id: "bgm",
	loop: true,
	volume: 0.6,
	autoplay: true
});

const engine = scene.createLocalSound("./assets/engine.mp3", {
	id: "engine",
	target: car,
	range: 30,
	loop: true,
	volume: 1.0
});

scene.playSound("engine");
scene.setSoundVolume("engine", 0.7);
scene.attachSoundToObject("engine", car);
scene.setLocalSoundPosition("engine", 5, 1, -3);
scene.pauseSound("engine");
scene.stopSound("engine");
scene.removeSound("engine");
```

### 2D Interfaces (Overlay + Surface)

```js
const hud = scene.createInterface({
	id: "hudHealth",
	mode: "overlay",
	clickable: true,
	layer: 20,
	x: 120,
	y: 50,
	width: 180,
	height: 48,
	text: "Health: 100",
	background: "rgba(0,0,0,0.45)",
	color: "#ffffff",
	fontSize: 20,
	onClick: ({ id }) => console.log("clicked", id)
});

const badge = scene.createInterface({
	id: "doorBadge",
	mode: "surface",
	target: door,
	localX: 0,
	localY: 1.2,
	localZ: 0.02,
	width: 120,
	height: 60,
	svg: '<svg viewBox="0 0 100 50"><rect width="100" height="50" fill="#1d4ed8"/><text x="50" y="30" text-anchor="middle" fill="white">OPEN</text></svg>'
});

scene.setInterfaceText("hudHealth", "Health: 85");
scene.setInterfaceSVG("doorBadge", '<svg viewBox="0 0 100 50"><rect width="100" height="50" fill="#dc2626"/></svg>');
scene.moveInterfaceBy("hudHealth", 10, 0);
scene.resizeInterface("hudHealth", 220, 56);
scene.stretchInterface("hudHealth", 1.2, 1);
scene.rotateInterface("hudHealth", 0.1);
scene.setInterfaceTransparency("hudHealth", 0.2);
scene.setInterfaceLayer("hudHealth", 30);
scene.setInterfaceClickable("hudHealth", true);
const offClick = scene.onInterfaceClick("hudHealth", (event) => {
	console.log("HUD clicked", event.x, event.y);
});
offClick();

scene.attachInterfaceToObject("hudHealth", player, { localY: 2.2, localZ: 0 });
scene.setInterfaceMode("hudHealth", "overlay");
scene.setInterfaceScreenPosition("hudHealth", 150, 40);
scene.removeInterface("doorBadge");
```

### Environment

```js
scene.setSkyColor("#87ceeb");
scene.setSkyTexture("./assets/sky.png");

scene.setSunDirectionFromPoints(playerHead, targetMarker, { distance: 120 });
scene.bindSunDirectionToPoints(playerHead, targetMarker, { distance: 120 });
scene.clearSunDirectionBinding();

scene.setSunColor("#ffeab3");
scene.setMoonColor("#b7c8ff");
scene.setSunTexture("./assets/sun.png");
scene.setMoonTexture("./assets/moon.png");
scene.setCloudTexture("./assets/clouds.png");

scene.setTimeOfDay(18.5);

scene.setFog("#dbeafe", 15, 120);
scene.clearFog();
```

## Notes

- Works in modern browsers and Electron renderer windows.
- If you are using raw browser modules (no Vite/Webpack/etc), add an `importmap` for `polygonal-js` and `three` as shown above.
- For Electron, run this from the renderer process (not the main process).
- `rotateObjectTo`, `rotateObjectBy`, `rotateGroupBy`, and `rotateCameraTo` use degrees.
- Created objects expose direct helper methods (for example `object.moveObjectBy(...)`) in addition to scene-level methods.
- `isHovering(object)` only returns true when that object is the front-most unobstructed object under the cursor.
- `setSunTexture`, `setMoonTexture`, and `setCloudTexture` currently store references for your game systems and extensions; core lighting/color/day-night behavior is active now.
- Spring welds keep an object between `minLength` and `maxLength` from the anchor using `elasticity` as response speed.
- Rope welds clamp distance to a max length (`length` or `maxLength`) and optionally support `minLength`.
- Elastic welds are intentionally looser than spring welds and can use `slack` for extra rubber-band behavior.
- Deform welds behave like rigid welds but can bend offset under impact; `durability` controls how strongly they resist deformation and `minLength` prevents collapse too close to the anchor.
- `createPoint` is a non-colliding transform marker. Use `createCollisionPoint` when you need a point-like object that participates in collisions.
- Stretch planes now support `collisionMode` and `collisionThickness` for reliable collision checks and physics blocking.

## License

MIT
