import { CommonConfig } from "./common.config";

export class Config extends CommonConfig {
	private static _supportsPassive = false;

	static set supportsPassive(val: boolean) {
		Config._supportsPassive = !!val;
	}

	static get supportsPassive() {
		return !!Config._supportsPassive;
	}

	static get wheelOption() {
		return Config.supportsPassive ? { passive: false } : false;
	}

	static get wheelEvent() {
		return "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";
	}
}
