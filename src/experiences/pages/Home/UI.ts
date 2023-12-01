import GSAP from "gsap";
import { EventEmitter } from "events";

// EXPERIENCE
import HomeExperience from ".";

// INTERFACES
import { type ExperienceBase } from "@/interfaces/experienceBase";

// CONSTANTS
import { GSAP_DEFAULT_INTRO_PROPS } from "@/constants/ANIMATION";

/**
 * Class in charge of all DOM HTML interactions (HTML user interface)
 */
export default class UI extends EventEmitter implements ExperienceBase {
	private readonly experience = new HomeExperience();

	loadedResourcesProgressLineElements?: HTMLElement | null;
	loadedResourcesProgressElements?: HTMLElement | null;
	lastLoadedResourceElement?: HTMLElement | null;
	modelBubblesContainerElement = document.querySelector<HTMLDivElement>(
		"#mode-bubbles-container"
	);

	constructor() {
		super();

		const _LOADED_RESOURCES_PROGRESS_LINE_ELEMENT = document.getElementById(
			"loaded-resources-progress-line"
		);
		const _LOADED_RESOURCES_PROGRESS_ELEMENT = document.getElementById(
			"loaded-resources-progress"
		);
		const _LAST_LOADED_RESOURCE_ELEMENT = document.getElementById(
			"last-loaded-resource"
		);

		if (_LOADED_RESOURCES_PROGRESS_LINE_ELEMENT)
			this.loadedResourcesProgressLineElements =
				_LOADED_RESOURCES_PROGRESS_LINE_ELEMENT;
		if (_LOADED_RESOURCES_PROGRESS_ELEMENT)
			this.loadedResourcesProgressElements = _LOADED_RESOURCES_PROGRESS_ELEMENT;
		if (_LAST_LOADED_RESOURCE_ELEMENT)
			this.lastLoadedResourceElement = _LAST_LOADED_RESOURCE_ELEMENT;
	}

	construct() {
		// EVENTS
		this.experience.loader?.on("start", () => {
			this.lastLoadedResourceElement?.classList.remove("animate-pulse");
			if (this.loadedResourcesProgressLineElements)
				this.loadedResourcesProgressLineElements.style.width = "0%";
			if (this.loadedResourcesProgressElements)
				this.loadedResourcesProgressElements.innerHTML = "0%";
		});

		this.experience.loader?.on("progress", (progress: number, url: string) => {
			if (this.loadedResourcesProgressLineElements)
				this.loadedResourcesProgressLineElements.style.width = progress + "%";
			if (this.loadedResourcesProgressElements)
				this.loadedResourcesProgressElements.innerHTML =
					progress.toFixed(0) + "%";
			if (this.lastLoadedResourceElement)
				this.lastLoadedResourceElement.innerHTML = url.replace(/^.*\//, "");
		});

		this.experience.loader?.on("load", () => {
			if (this.loadedResourcesProgressElements)
				this.loadedResourcesProgressElements.innerHTML = "100%";
			if (this.loadedResourcesProgressLineElements)
				this.loadedResourcesProgressLineElements.style.width = "100%";

			setTimeout(() => {
				if (this.lastLoadedResourceElement)
					this.lastLoadedResourceElement.innerHTML =
						"Resources Loaded Successfully";

				this.intro();
				this.emit("ready");
			}, 1000);
		});

		this.experience.app.resources.startLoading();
	}

	destruct() {
		this.loadedResourcesProgressLineElements = undefined;
		this.loadedResourcesProgressElements = undefined;
		this.lastLoadedResourceElement = undefined;
	}

	intro() {
		const _TIMELINE = GSAP.timeline();
		_TIMELINE.to("#landing-view-wrapper", {
			...GSAP_DEFAULT_INTRO_PROPS,
			opacity: 0,
			delay: 2,
			onComplete: () => {
				const _LANDING_VIEW_WRAPPER = document.getElementById(
					"landing-view-wrapper"
				);

				if (_LANDING_VIEW_WRAPPER?.style)
					_LANDING_VIEW_WRAPPER.style.display = "none";
			},
		});
	}
}