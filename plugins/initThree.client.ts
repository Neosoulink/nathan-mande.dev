import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface initThreeProps {
	appDom?: string;
	enableOrbit?: boolean;
	axesSizes?: number;
	sceneSizes?: {
		width: number;
		height: number;
	};
	control?: OrbitControls;
	autoSceneResize?: boolean;
}

export type initThreeResponseType = {
	canvas: HTMLCanvasElement;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	animate: (callback?: () => any, enabledRenderer?: boolean) => void;
	sceneSizes: { width: number; height: number };
	control: OrbitControls;
};

export type initThreeType = (props?: initThreeProps) => initThreeResponseType;

// DEFS
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let viewPortSize = {
	width: window.innerWidth,
	height: window.innerHeight,
};

// FUNCTIONS
export const animate: initThreeResponseType["animate"] = (
	callback: () => any = () => {},
	enabledRenderer = true
) => {
	enabledRenderer && renderer.render(scene, camera);
	callback();
	requestAnimationFrame(() => animate(callback, enabledRenderer));
};

export const initThree: initThreeType = (props?: initThreeProps) => {
	const DOM_APP = document.querySelector<HTMLCanvasElement>(
		props?.appDom ?? "canvas#app"
	)!;
	const SCENE_SIZES: initThreeProps["sceneSizes"] =
		props?.sceneSizes ?? viewPortSize;

	// SCENE & CAMERA
	scene = new THREE.Scene();

	// Perspective camera
	camera = new THREE.PerspectiveCamera(
		75,
		SCENE_SIZES.width / SCENE_SIZES.height,
		0.1,
		1000
	);

	renderer = new THREE.WebGLRenderer({
		canvas: DOM_APP,
		antialias: true,
		alpha: true,
	});
	renderer.setSize(SCENE_SIZES.width, SCENE_SIZES.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	// ORBIT CONTROL
	const ORBIT_CONTROL = new OrbitControls(camera, renderer.domElement);
	ORBIT_CONTROL.enabled = !!props?.enableOrbit;

	if (typeof props?.axesSizes === "number") {
		const AXES_HELPER = new THREE.AxesHelper(props?.axesSizes);
		scene.add(AXES_HELPER);
	}

	if (props?.autoSceneResize === undefined || props?.autoSceneResize === true) {
		window.addEventListener("resize", () => {
			viewPortSize.width = window.innerWidth;
			viewPortSize.height = window.innerHeight;

			camera.aspect = viewPortSize.width / viewPortSize.height;
			camera.updateProjectionMatrix();

			renderer.setSize(viewPortSize.width, viewPortSize.height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		});
	}

	return {
		canvas: DOM_APP,
		scene,
		camera,
		renderer,
		animate,
		sceneSizes: SCENE_SIZES,
		control: ORBIT_CONTROL,
	};
};

export default defineNuxtPlugin(() => {
	return {
		provide: {
			initThree,
		},
	};
});