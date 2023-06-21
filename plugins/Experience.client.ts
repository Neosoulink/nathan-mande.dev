import * as THREE from "three";
import QuickThree from "quick-threejs";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GUI from "lil-gui";
import GSAP from "gsap";

export interface ExperienceProps {
	/**
	 * String dom element reference of the canvas
	 */
	domElementRef: string;
	/**
	 * Event triggered when the scene is construct
	 */
	onConstruct?: () => unknown;
	/**
	 * Event triggered when the scene is destructed
	 */
	onDestruct?: () => unknown;
}

export class Experience {
	app: QuickThree;
	mainGroup?: THREE.Group;
	gui?: GUI;
	loadingManager = new THREE.LoadingManager();
	isometricRoom?: THREE.Group;
	cameraCurvePathProgress = 0;
	curvePosition = new THREE.Vector3(0, -1, 0);
	curveLookAtPosition = new THREE.Vector3(0, 0, 0);

	directionalVector = new THREE.Vector3(0, 0, 0);
	staticVector = new THREE.Vector3(0, 1, 0);
	crossVector = new THREE.Vector3(0, 0, 0);
	started = false;
	lerp = {
		current: 0,
		target: 0,
		ease: 0.1,
	};
	onConstruct?: () => unknown;
	onDestruct?: () => unknown;
	back = false;

	constructor(props: ExperienceProps) {
		this.app = new QuickThree(
			{
				enableControls: true,
				axesSizes: 5,
				gridSizes: 20,
				withMiniCamera: true,
				camera: "Perspective",
			},
			props.domElementRef
		);
		if (this.app._camera.controls) {
			this.app._camera.controls.enabled = false;
		}

		this.gui = this.app.debug?.ui?.addFolder(Experience.name);
		this.gui?.add({ fn: () => this.construct() }, "fn").name("Enable");
		this.gui?.close();

		if (props?.onConstruct) this.onConstruct = props?.onConstruct;
		if (props?.onDestruct) this.onDestruct = props?.onDestruct;
	}

	destroy() {
		if (this.mainGroup) {
			this.mainGroup.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();

					for (const key in child.material) {
						const value = child.material[key];

						if (value && typeof value.dispose === "function") {
							value.dispose();
						}
					}
				}
			});

			this.app.scene.remove(this.mainGroup);

			this.mainGroup?.clear();
			this.mainGroup = undefined;

			if (this.gui) {
				this.gui.destroy();
				this.gui = undefined;
			}

			this.gui = this.app.debug?.ui?.addFolder(Experience.name);
			this.gui
				?.add({ function: () => this.construct() }, "function")
				.name("Enable");

			this.loadingManager.removeHandler(/onStart|onError|onProgress|onLoad/);

			if (this.app.updateCallbacks[Experience.name]) {
				delete this.app.updateCallbacks[Experience.name];
			}

			this.app.destroy();

			this.onDestruct && this.onDestruct();
		}
	}

	async construct() {
		if (this.gui) {
			this.gui.destroy();
			this.gui = undefined;
		}

		if (this.mainGroup) {
			this.destroy();
		}

		if (!this.mainGroup) {
			this.mainGroup = new THREE.Group();

			// LOADERS
			const DRACO_LOADER = new DRACOLoader();
			DRACO_LOADER.setDecoderPath("/decoders/draco/");

			const GLTF_LOADER = new GLTFLoader(this.loadingManager);
			GLTF_LOADER.setDRACOLoader(DRACO_LOADER);

			const TEXTURE_LOADER = new THREE.TextureLoader(this.loadingManager);

			// LIGHTS
			const AMBIENT_LIGHT = new THREE.AmbientLight(0xffffff, 0);
			const DIRECTIONAL_LIGHT = new THREE.DirectionalLight(0xffffff, 0.1);
			DIRECTIONAL_LIGHT.position.set(0, 0, 1);

			/**
			 * Texture
			 */
			const BAKED_TEXTURE = TEXTURE_LOADER.load(
				"/3d_models/isometric_room/baked-isometric-room.jpg"
			);
			BAKED_TEXTURE.flipY = false;
			BAKED_TEXTURE.colorSpace = THREE.SRGBColorSpace;

			/**
			 * Materials
			 */
			const BAKED_MATERIAL = new THREE.MeshBasicMaterial({
				map: BAKED_TEXTURE,
				side: THREE.DoubleSide,
			});

			// MODELS
			GLTF_LOADER.load(
				"/3d_models/isometric_room/isometric_room.glb",
				(glb) => {
					const _REG = new RegExp(/.*screen/);

					glb.scene.scale.set(0.5, 0.5, 0.5);
					glb.scene.traverse((child) => {
						if (child instanceof THREE.Mesh && !_REG.test(child.name)) {
							child.material = BAKED_MATERIAL;
						}
					});

					(this.isometricRoom = glb.scene).position.set(0, -5, -10);
					(this.isometricRoom = glb.scene).rotation.set(0.3, -0.2, 0);

					this.mainGroup && this.mainGroup.add(this.isometricRoom);
				}
			);

			// CAMERA
			// @ts-ignore Proxy class error
			if (this.app.camera?.fov) this.app.camera.fov = 35;
			this.app.camera?.updateProjectionMatrix();
			this.app.camera?.position.set(0, 0, 20);
			this.app._camera.miniCamera?.position.set(10, 8, 30);
			if (this.app.camera?.far) {
				this.app.camera.far = 50;
			}

			// HELPERS
			const CAMERA_HELPER = this.app.camera
				? new THREE.CameraHelper(this.app.camera)
				: undefined;

			// ADD TO SCENE
			this.mainGroup.add(AMBIENT_LIGHT, DIRECTIONAL_LIGHT);
			CAMERA_HELPER && this.mainGroup.add(CAMERA_HELPER);
			this.app.scene.add(this.mainGroup);

			// Create a closed wavey loop
			const CURVE = new THREE.CatmullRomCurve3([
				new THREE.Vector3(0, 2.5, 10),
				new THREE.Vector3(7.25, 4, 7.25),
				new THREE.Vector3(10, 2.5, 0),
			]);

			const POINTS = CURVE.getPoints(50);
			const GEOMETRY = new THREE.BufferGeometry().setFromPoints(POINTS);

			const MATERIAL = new THREE.LineBasicMaterial({ color: 0xff0000 });

			// Create the final object to add to the scene
			const CURVE_OBJECT = new THREE.Line(GEOMETRY, MATERIAL);

			this.app.scene.add(CURVE_OBJECT);
			this.onWheel();

			// ANIMATIONS
			this.app.setUpdateCallback("root", () => {
				if (CAMERA_HELPER) {
					CAMERA_HELPER.matrixWorldNeedsUpdate = true;
					CAMERA_HELPER.update();
					this.app.camera?.position &&
						CAMERA_HELPER.position.copy(this.app.camera?.position);
					this.app.camera?.rotation &&
						CAMERA_HELPER.rotation.copy(this.app.camera?.rotation);
				}

				if (this.started) {
					this.lerp.current = GSAP.utils.interpolate(
						this.lerp.current,
						this.lerp.target,
						this.lerp.ease
					);

					this.lerp.target = this.lerp.target + (this.back ? -0.001 : 0.001);
					this.lerp.target = GSAP.utils.clamp(0, 1, this.lerp.target);
					this.lerp.current = GSAP.utils.clamp(0, 1, this.lerp.current);

					CURVE.getPointAt(this.lerp.current % 1, this.curvePosition);
					CURVE.getPointAt(
						GSAP.utils.clamp(
							0,
							1,
							(this.lerp.current + (this.back ? -0.00001 : 0.00001)) % 1
						),
						this.curveLookAtPosition
					);

					this.directionalVector.subVectors(
						CURVE.getPointAt(
							GSAP.utils.clamp(0, 1, (this.lerp.current % 1) + 0.000001)
						),
						this.curvePosition
					);
					this.directionalVector.normalize();
					this.crossVector.crossVectors(
						this.directionalVector,
						this.staticVector
					);
					this.crossVector.multiplyScalar(100000);

					this.app.camera?.position.copy(this.curvePosition);
					if (this.isometricRoom) {
						const P = new THREE.Vector3().copy(this.isometricRoom.position);
						P.y += 1;
						this.app.camera?.lookAt(P);
						if (this.app._camera.controls)
							this.app._camera.controls.target = P;
					}
				}
			});
		}
	}

	onWheel() {
		window.addEventListener("wheel", (e) => {
			if (e.deltaY < 0) {
				this.lerp.target += 0.1;
				this.back = false;
			} else {
				this.lerp.target -= 0.1;
				this.back = true;
			}
		});
	}

	start() {
		const _DEFAULT_PROPS = {
			duration: 2.5,
			ease: "M0,0 C0.001,0.001 0.002,0.003 0.003,0.004 0.142,0.482 0.284,0.75 0.338,0.836 0.388,0.924 0.504,1 1,1 ",
		};

		if (this.mainGroup && this.isometricRoom) {
			GSAP.to(this.isometricRoom.rotation, {
				x: 0,
				y: 0,
				..._DEFAULT_PROPS,
			});
			GSAP.to(this.isometricRoom.position, {
				y: 0,
				z: 0,
				..._DEFAULT_PROPS,
			});
		}

		this.started = true;
		if (this.lerp.target < 0) {
			this.lerp.target = 1;
		}
	}
}

export default defineNuxtPlugin(() => {
	return {
		provide: {
			Experience,
		},
	};
});
