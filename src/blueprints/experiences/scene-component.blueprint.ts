import { Group, Mesh, Object3D, type Object3DEventMap, Material } from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

// BLUEPRINTS
import { ExperienceBasedBlueprint } from "./experience-based.blueprint";

// EXPERIENCES
import { HomeExperience } from "~/experiences/home";

// STATIC
import { errors, events } from "~/static";

// ERRORS
import { ErrorFactory } from "~/errors";

// MODELS
import type {
	Materials,
	ModelChildrenMaterials,
} from "~/common/experiences/experience-world.model";
import type { NavigationView } from "~/common/experiences/navigation.model";

// TODO: Link with the names of assets in the `app.loader` assets names
export interface SceneBlueprintProps {
	modelName: string;
	childrenMaterials: ModelChildrenMaterials;
	onTraverseModelScene?: (child: Object3D<Object3DEventMap>) => unknown;
}

export abstract class SceneComponentBlueprint extends ExperienceBasedBlueprint {
	/**
	 * Called each time the model scene is traversed.
	 *
	 * @param child Model scene child
	 */
	private _onTraverseModelScene?: SceneBlueprintProps["onTraverseModelScene"];

	protected readonly _experience = new HomeExperience();
	protected readonly _appCamera = this._experience.app.camera;
	protected readonly _loader = this._experience.loader;
	protected readonly _childrenMaterials: ModelChildrenMaterials;

	protected _world = this._experience.world;
	protected _model?: GLTF;
	protected _modelScene?: Group;
	protected _availableMaterials: Materials = {};

	public abstract readonly navigationLimits?: {
		spherical: Exclude<NavigationView["spherical"], undefined>["limits"];
		target: Exclude<NavigationView["target"], undefined>["limits"];
	};

	constructor(_: SceneBlueprintProps) {
		super();

		this._childrenMaterials = _.childrenMaterials;

		this._experience.loader?.on(events.LOADED, () => {
			const _MODEL = this._experience.app.resources.items[_.modelName] as
				| GLTF
				| undefined;
			if (_MODEL?.scene) this._model = _MODEL;
		});

		this._onTraverseModelScene = _.onTraverseModelScene;
	}

	public get modelScene() {
		return this._modelScene;
	}

	protected abstract _getAvailableMaterials(): Materials;

	/**
	 * Initialize the model scene
	 *
	 * > 🚧 Must be called before other initializers.
	 */
	protected _initModelScene() {
		this._modelScene = this._model?.scene.clone();
	}

	/**
	 * Initialize model materials
	 *
	 * > 🚧 Must be called after `{@link SceneBlueprintProps.modelScene}` has been initialized.
	 */
	protected _initModelMaterials() {
		if (!Object.keys(this._availableMaterials).length) return;

		this.modelScene?.traverse((child) => {
			this._onTraverseModelScene && this._onTraverseModelScene(child);

			if (
				!this._childrenMaterials[child.name] ||
				!(
					this._availableMaterials[
						this._childrenMaterials[child.name]
					] instanceof Material
				) ||
				!(child instanceof Mesh)
			)
				return;

			~(child.material =
				this._availableMaterials[this._childrenMaterials[child.name]]);
		});
	}

	public construct(callback?: () => void) {
		this._world = this._experience.world;
		this._initModelScene();

		if (!this.modelScene)
			throw new ErrorFactory(
				new Error("No model scene founded", { cause: errors.WRONG_PARAM })
			);

		if (typeof callback === "function") callback();

		this._availableMaterials = {
			...this._world?.commonMaterials,
			...this._getAvailableMaterials(),
		};
		this._initModelMaterials();
		this.emit(events.CONSTRUCTED);
	}

	public destruct() {
		this.modelScene?.clear();
		this.modelScene?.removeFromParent();
		this.emit(events.DESTRUCTED);
	}

	public intro(): void {}

	public outro(): void {}

	public update(): void {}
}
