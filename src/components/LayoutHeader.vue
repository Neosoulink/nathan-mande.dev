<script lang="ts" setup>
// CONSTANTS
import packageJson from "../../package.json";

// COMPOSAPLES
import { useMenuState } from "../composables/menu";

// STATES
const IS_MENU_OPEN = useMenuState();
</script>

<template>
	<header class="relative z-40 w-screen text-light">
		<nav>
			<Container
				className="flex flex-row justify-between items-center md:mt-[50px] mt-6"
			>
				<h1>
					<a href="/" class="flex flex-row items-center text-2xl font-semibold">
						<img
							src="../assets/img/logo.png"
							class="h-10 min-w-[40px] rounded-full drop-shadow-md mr-3 transition-all"
						/>

						<span
							class="flex flex-row items-center text-lg font-semibold uppercase"
						>
							<div
								v-for="(c, i) in packageJson.name.split('')"
								:key="i"
								class="transition-all drop-shadow-md"
							>
								{{ c }}
							</div>
						</span>
					</a>
				</h1>

				<hamburger-menu-button
					:active="IS_MENU_OPEN"
					@click="
						() => {
							IS_MENU_OPEN = !IS_MENU_OPEN;
						}
					"
				/>
			</Container>
		</nav>
	</header>
</template>

<style lang="scss" scoped>
h1:hover img {
	scale: 1.05;
}

@for $i from 1 through 12 {
	h1:hover span > div:nth-child(#{$i}) {
		transition-delay: 0.03s * ($i + 1);
		scale: 1.05;
		translate: 5px * ($i * 0.25);
	}
}
</style>
