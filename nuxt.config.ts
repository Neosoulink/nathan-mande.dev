import glslify from "vite-plugin-glslify";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
	devtools: { enabled: true },
	alias: {
		"~blueprints/*": "../src/blueprints/*",
		"~config": "../src/config",
		"~config/*": "../src/config/*",
		"~experiences/*": "../src/experiences/*",
		"~errors": "../src/errors",
		"~errors/*": "../src/errors/*",
		"~common/*": "../src/common/*",
		"~static": "../src/static",
		"~static/*": "../src/static/*",
	},
	app: {
		head: {
			title: "nsl-me",
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ hid: "description", name: "description", content: "" },
				{ name: "format-detection", content: "telephone=no" },
			],
			link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
		},
	},
	modules: ["@nuxt/content", ""],
	css: ["~/assets/css/index.css"],
	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
	srcDir: "./src",
	runtimeConfig: {
		public: {
			env: process.env.MODE,
		},
	},
	vite: {
		plugins: [glslify()],
	},
	typescript: {
		typeCheck: true,
		strict: true,
	},
});
