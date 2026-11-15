<script>
	/** `light`: white bubble and wordmark for dark bands (footer, intro). */
	let { light = false } = $props();
</script>

<!-- The SkillCheck logo: speech bubble with a check, and the wordmark. Same as on skillcheck.fi. -->
<span class="sc" class:light>
	<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
		<path d="M7 3h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H15.5L9 30v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill={light ? '#fff' : '#003580'} />
		<path d="M10 14.5l4.2 4.2L22.5 10.5" stroke={light ? '#003580' : '#fff'} stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
	<span class="sc__word">Skill<span class="sc__check">Check</span></span>
</span>

<style>
	.sc {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	svg {
		width: 1.75rem;
		height: 1.75rem;
	}

	.sc__word {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.15rem;
		letter-spacing: -0.01em;
		color: #0b1b33;
	}

	.sc__check {
		color: #003580;
	}

	.light .sc__word,
	.light .sc__check {
		color: #fff;
	}
</style>
