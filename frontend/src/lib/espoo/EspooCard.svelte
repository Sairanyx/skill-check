<script>
	/** Midnight content card with an apricot title, as on espoo.fi. */
	let { title = '', eyebrow = '', children } = $props();
</script>

<article class="card">
	{#if eyebrow}<span class="card__eyebrow">{eyebrow}</span>{/if}
	{#if title}<h3>{title}</h3>{/if}
	{@render children()}
</article>

<style>
	.card {
		display: grid;
		align-content: start;
		gap: 0.6rem;
		padding: 1.4rem 1.5rem;
		background-color: var(--espoo-midnight);
		border-radius: var(--espoo-radius);
	}

	.card__eyebrow {
		font-size: 0.8125rem;
		color: var(--espoo-text-muted);
	}

	h3 {
		color: var(--espoo-apricot);
	}
</style>
