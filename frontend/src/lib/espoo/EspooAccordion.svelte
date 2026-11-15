<script>
	let { title, open = false, children } = $props();
</script>

<details class="accordion" {open}>
	<summary>{title}</summary>
	<div class="accordion__panel">{@render children()}</div>
</details>

<style>
	.accordion {
		background-color: var(--espoo-midnight);
		border: 1px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		color: var(--espoo-apricot);
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::after {
		content: '+';
		display: inline-grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border: 1.5px solid currentColor;
		border-radius: 50%;
		font-weight: 400;
		flex-shrink: 0;
	}

	.accordion[open] summary::after {
		content: '−';
	}

	summary:hover {
		color: var(--espoo-white);
	}

	.accordion__panel {
		padding: 0 1.25rem 1.25rem;
	}
</style>
