<script>
	/** Inline "working on it" line: a spinner plus a short explanation. */
	let { children } = $props();
</script>

<div class="spinner-row" role="status">
	<span class="spinner" aria-hidden="true"></span>
	<span>{@render children()}</span>
</div>

<style>
	.spinner-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.9rem 1.1rem;
		background-color: var(--espoo-navy);
		border-left: 0.25rem solid var(--espoo-apricot);
	}

	.spinner {
		width: 1.4rem;
		height: 1.4rem;
		border: 0.2rem solid var(--espoo-apricot);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.85s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
