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
				id: "ground",
				width: 20,
				height: 20,
				rotationX: -Math.PI / 2,
				y: -1,
				color: "#222831"
			});

			const cube = scene.createBox({
				id: "cube",
				x: 0,
				y: 0,
				z: 0,
				color: "#44d6a7",
				texture: "./assets/crate.png"
			});

			scene.onUpdate((delta) => {
				scene.rotateObjectBy(cube, 0, delta, 0);
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
const player = scene.createSphere({ id: "player", radius: 0.75, color: "#f9ed69" });

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
const box = scene.createBox({ id: "box1", width: 1, height: 1, depth: 1, color: "#ff6b6b" });
const sphere = scene.createSphere({ id: "ball", radius: 0.5, color: "#4d96ff" });
const cylinder = scene.createCylinder({ id: "col", radiusTop: 0.5, radiusBottom: 0.5, height: 2 });
const plane = scene.createPlane({ id: "ground", width: 20, height: 20, rotationX: -Math.PI / 2 });
```

### OBJ Import

```js
const tree = await scene.importOBJ("./assets/tree.obj", {
	id: "tree01",
	x: 3,
	y: 0,
	z: -5,
	recolorChildren: false
});
```

### Object Manipulation

```js
scene.moveObjectTo("box1", 2, 1, -3);
scene.moveObjectBy("box1", 0.1, 0, 0);

scene.scaleObjectTo("box1", 2, 2, 2);
scene.scaleObjectBy("box1", 1.1, 1, 1);

scene.rotateObjectTo("box1", 0, Math.PI / 4, 0);
scene.rotateObjectBy("box1", 0, 0.01, 0);

scene.setObjectColor("box1", "#00ff88");
scene.setObjectTexture("box1", "./assets/metal.png");

scene.removeObject("box1");
```

### Physics

```js
scene.enablePhysics("player", {
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

scene.addForce("player", 5, 8, 0);
scene.setPhysicsVelocity("player", 0, 0, 0);
scene.disablePhysics("player");
scene.clearPhysicsFloor();
```

### Welds (Bind Multiple Objects)

```js
const weldId = scene.createWeld(["player", "sword", "shield"], {
	id: "playerGear",
	anchor: "player"
});

// Move anchor and welded members follow while preserving offsets.
scene.moveObjectBy("player", 1, 0, 0);

const weldInfo = scene.getWeld("playerGear");
scene.removeWeld("playerGear");
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
if (scene.checkCollision("player", "wall")) {
	console.log("Collision detected");
}

if (scene.isHovering("player")) {
	scene.setObjectColor("player", "#ffffff");
}

const hovered = scene.getHoveredObject();
```

### Lights

```js
const ambient = scene.createAmbientLight({ id: "amb", color: "#ffffff", brightness: 0.4 });
const sun = scene.createDirectionalLight({ id: "sun", color: "#fff0cc", brightness: 1.1, x: 50, y: 80, z: 20 });
const lamp = scene.createPointLight({ id: "lamp", color: "#ffddaa", brightness: 1.2, range: 30, x: 0, y: 3, z: 0 });
const spot = scene.createSpotLight({ id: "spot", color: "#cce7ff", brightness: 1.0, range: 60, x: 0, y: 8, z: 5 });

scene.moveLightTo("lamp", 2, 3, 1);
scene.moveLightBy("lamp", 0, 0, -1);
scene.setLightColor("lamp", "#aaffcc");
scene.setLightBrightness("lamp", 0.8);
scene.setLightRange("lamp", 40);
scene.removeLight("spot");
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
- `setSunTexture`, `setMoonTexture`, and `setCloudTexture` currently store references for your game systems and extensions; core lighting/color/day-night behavior is active now.

## License

MIT
