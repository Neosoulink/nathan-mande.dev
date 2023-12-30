import { PerspectiveCamera, Vector3 } from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import gsap from "gsap";

// EXPERIENCES
import { HomeExperience } from ".";

// BLUEPRINTS
import { ExperienceBasedBlueprint } from "~/experiences/blueprints/experience-based.blueprint";

// MODELS
import { CONSTRUCTED, DESTRUCTED } from "~/common/event.model";
import { CAMERA_UNAVAILABLE, WRONG_PARAM } from "~/common/error.model";

// CONFIG
import { Config } from "~/experiences/config";

export class Camera extends ExperienceBasedBlueprint {
	protected readonly _experience = new HomeExperience();

	private readonly _appCamera = this._experience.app.camera;
	private readonly _appCameraInstance = this._experience.app.camera.instance;
	private readonly _appDebug = this._experience.app.debug;
	private readonly _timeline = gsap.timeline();

	private _lookAtPosition = new Vector3();
	private _currentCameraIndex = 0;
	private _prevCameraProps = {
		fov: 0,
		aspect: 0,
		near: 0,
		far: 0,
	};

	public readonly initialCameraFov = 35;
	public readonly cameras = [
		(() =>
			this._appCameraInstance instanceof PerspectiveCamera
				? new PerspectiveCamera().copy(this._appCameraInstance)
				: new PerspectiveCamera())(),
		(() =>
			this._appCameraInstance instanceof PerspectiveCamera
				? new PerspectiveCamera(
						this._appCameraInstance.fov,
						Config.FIXED_WINDOW_WIDTH / Config.FIXED_WINDOW_HEIGHT,
						this._appCameraInstance.near,
						this._appCameraInstance.far
				  )
				: new PerspectiveCamera())(),
	] as const;

	constructor() {
		super();
	}

	public get currentCameraIndex() {
		return this._currentCameraIndex;
	}

	public get lookAtPosition() {
		return this._lookAtPosition.clone();
	}

	public get timeline() {
		return this._timeline;
	}

	public construct() {
		if (!Config.DEBUG && this._appDebug?.cameraHelper) {
			this._experience.app.scene.remove(this._appDebug?.cameraHelper);
			this._appDebug?.cameraHelper?.remove();
			this._appDebug?.cameraHelper?.dispose();
		}

		if (this._experience.app.debug?.cameraControls)
			this._experience.app.debug.cameraControls.enabled = false;

		if (!(this._appCameraInstance instanceof PerspectiveCamera)) return;

		this.correctAspect();
		this._appCamera.miniCamera?.position.set(10, 8, 30);
		this._prevCameraProps = {
			fov: this._appCameraInstance.fov,
			aspect: this._appCameraInstance.aspect,
			near: this._appCameraInstance.near,
			far: this._appCameraInstance.far,
		};

		this.emit(CONSTRUCTED);
	}

	public destruct() {
		this.emit(DESTRUCTED);
	}

	public cameraZoomIn() {
		if (this._experience.app?.camera.instance instanceof PerspectiveCamera)
			this._timeline.to(this._experience.app?.camera.instance, {
				fov: 25,
			});
	}

	public cameraZoomOut() {
		if (this._experience.app?.camera.instance instanceof PerspectiveCamera)
			this._timeline.to(this._experience.app?.camera.instance, {
				fov: this._experience.camera?.initialCameraFov ?? 0,
			});
	}

	/**
	 * Switch between available cameras
	 *
	 * @param cameraIndex The camera index to switch at
	 */
	public switchCamera(cameraIndex: number) {
		if (this.currentCameraIndex === cameraIndex) return;

		// TODO: 🚧 Improvement required. Correctly get the previous camera properties.
		if (
			!(
				typeof cameraIndex === "number" &&
				cameraIndex >= 0 &&
				cameraIndex <= this.cameras.length - 1
			)
		)
			throw new Error("Camera index not available", { cause: WRONG_PARAM });
		if (!(this._appCameraInstance instanceof PerspectiveCamera))
			throw new Error(undefined, { cause: CAMERA_UNAVAILABLE });

		const currentCamera = this.cameras[this.currentCameraIndex];
		const nextCamera = this.cameras[cameraIndex];

		currentCamera.copy(this._appCameraInstance);
		currentCamera.fov = nextCamera.fov;
		currentCamera.aspect = nextCamera.aspect;
		currentCamera.near = nextCamera.near;
		currentCamera.far = nextCamera.far;

		this._appCameraInstance.copy(nextCamera);

		this._appCameraInstance.fov = this._prevCameraProps.fov;
		this._appCameraInstance.aspect = this._prevCameraProps.aspect;
		this._appCameraInstance.near = this._prevCameraProps.near;
		this._appCameraInstance.far = this._prevCameraProps.far;

		this.correctAspect();
		currentCamera.updateProjectionMatrix();

		this._prevCameraProps = {
			fov: nextCamera.fov,
			aspect: nextCamera.aspect,
			near: nextCamera.near,
			far: nextCamera.far,
		};
		this._currentCameraIndex = cameraIndex;
	}

	/**
	 * Set the camera look at position.
	 * @param v3 The {@link Vector3} position where the the camera will look at.
	 */
	public setCameraPosition(v3 = new Vector3()) {
		return this._appCameraInstance?.position.copy(v3);
	}

	/**
	 * Set the camera look at position.
	 * @param v3 The {@link Vector3} position where the the camera will look at.
	 */
	public setCameraLookAt(v3 = new Vector3()) {
		const V3 = v3.clone();
		this._appCameraInstance?.lookAt(V3);

		return (this._lookAtPosition = V3);
	}

	/** Correct the aspect ration of the camera. */
	public correctAspect() {
		if (!(this._appCameraInstance instanceof PerspectiveCamera)) return;

		this._appCameraInstance.fov = this.initialCameraFov;
		this._appCameraInstance.far = 500;
		this._appCamera.resize();

		return this._appCamera;
	}

	/**
	 * Move the camera position with transition from
	 * the origin position to the passed position and,
	 * update the lookAt position using the passed lookAt position.
	 *
	 * @param toPosition The new camera position.
	 * @param lookAt Where the camera will look at.
	 */
	public updateCameraPosition(
		toPosition = new Vector3(),
		lookAt = new Vector3(),
		onStart: gsap.Callback = () => {},
		onUpdate: gsap.Callback = () => {},
		onComplete: gsap.Callback = () => {}
	) {
		if (!this._experience.app?.camera.instance) return this._timeline;

		const lookAtA = this._lookAtPosition.clone();
		const lookAtB = lookAt.clone();

		return this._timeline.to(this._experience.app.camera.instance.position, {
			x: toPosition.x,
			y: toPosition.y,
			z: toPosition.z,
			duration: Config.GSAP_ANIMATION_DURATION,
			ease: Config.GSAP_ANIMATION_EASE,
			onStart: () => {
				gsap.to(lookAtA, {
					x: lookAtB.x,
					y: lookAtB.y,
					z: lookAtB.z,
					duration: Config.GSAP_ANIMATION_DURATION * 0.55,
					ease: Config.GSAP_ANIMATION_EASE,
					onUpdate: () => {
						this?.setCameraLookAt(lookAtA);
					},
				});
				onStart();
			},
			onUpdate,
			onComplete,
		});
	}

	public update() {}
}
