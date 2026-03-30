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
npm install polygonal-js three
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
		<script type="module">
			import { createScene } from "./node_modules/polygonal-js/src/index.js";

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
	if (event.key === "ArrowRight") scene.moveObjectBy(player, 0.15, 0, 0);
	if (event.key === "ArrowLeft") scene.moveObjectBy(player, -0.15, 0, 0);
	if (event.key === "ArrowUp") scene.moveObjectBy(player, 0, 0, -0.15);
	if (event.key === "ArrowDown") scene.moveObjectBy(player, 0, 0, 0.15);
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
scene.moveObjectTo(box, 2, 1, -3);
scene.moveObjectBy(box, 0.1, 0, 0);

scene.scaleObjectTo(box, 2, 2, 2);
scene.scaleObjectBy(box, 1.1, 1, 1);

scene.rotateObjectTo(box, 0, 45, 0); // degrees
scene.rotateObjectBy(box, 0, 1, 0);  // degrees delta

scene.setObjectColor(box, "#00ff88");
scene.setObjectTexture(box, "./assets/metal.png");
scene.setObjectTransparency(box, 0.35);
scene.setObjectReflectance(box, 0.8);
scene.setObjectCollisionMode(box, "precise"); // none | simple | precise

scene.removeObject(box);
```

### Physics

```js
scene.enablePhysics(player, {
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

scene.addForce(player, 5, 8, 0);
scene.setPhysicsVelocity(player, 0, 0, 0);
scene.disablePhysics(player);
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

if (scene.isHovering(player)) {
	scene.setObjectColor(player, "#ffffff");
}

const hovered = scene.getHoveredObject();
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
- For Electron, run this from the renderer process (not the main process).
- `rotateObjectTo`, `rotateObjectBy`, `rotateGroupBy`, and `rotateCameraTo` use degrees.
- Create methods now return real object references; pass those variables directly into API methods.
- `setSunTexture`, `setMoonTexture`, and `setCloudTexture` currently store references for your game systems and extensions; core lighting/color/day-night behavior is active now.

## License

MIT
