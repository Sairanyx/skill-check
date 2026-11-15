<script>
	/**
	 * An answer after the privacy guard, with every removed detail shown as a chip,
	 * so people see what was taken out before any AI read it.
	 * `from` (seconds): chips pop in one by one from that moment (intro only).
	 */
	let { text, from = null } = $props();
	const TAGS = /(\[(?:NAME|EMPLOYER|SCHOOL|PLACE|ORIGIN|CONTACT|YEAR|PERSONAL)\])/g;
	const LABEL = { NAME: 'name', EMPLOYER: 'employer', SCHOOL: 'school', PLACE: 'place', ORIGIN: 'origin', CONTACT: 'contact', YEAR: 'year', PERSONAL: 'age, health or family' };
	const parts = $derived(text.split(TAGS));
	const tagIndex = (i) => parts.slice(0, i).filter((p) => TAGS.test(p) && (TAGS.lastIndex = 0, true)).length;
</script>

{#each parts as part, i (i)}{#if /^\[[A-Z]+\]$/.test(part) && LABEL[part.slice(1, -1)]}<span
			class="chip"
			class:pop={from !== null}
			style={from !== null ? `animation-delay: ${from + tagIndex(i) * 0.35}s` : undefined}
			title="Removed before any AI read the answer">{LABEL[part.slice(1, -1)]} removed</span
		>{:else}{part}{/if}{/each}

<style>
	.chip {
		display: inline-block;
		margin-inline: 0.1rem;
		padding: 0 0.45rem;
		border-radius: 0.4rem;
		background-color: var(--espoo-apricot);
		color: var(--espoo-on-blue);
		font-size: 0.85em;
		font-weight: 600;
		line-height: 1.5;
	}

	@keyframes pop {
		0% { opacity: 0; transform: scale(0.5); }
		70% { opacity: 1; transform: scale(1.1); }
		100% { opacity: 1; transform: scale(1); }
	}

	.pop {
		animation: pop 0.45s ease-out both;
	}

	@media (prefers-reduced-motion: reduce) {
		.pop { animation: none; }
	}
</style>
