<script>
	/**
	 * EspooAccordion — Expandable disclosure panel using Espoo's --backgrounds--accordion (#DFE5EB).
	 */
	let { title, open = $bindable(false), children } = $props();
</script>

<div class="espoo-accordion" class:is-open={open}>
	<button
		type="button"
		class="espoo-accordion__trigger"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<span class="espoo-accordion__title">{title}</span>
		<span class="espoo-accordion__icon" aria-hidden="true">{open ? '−' : '+'}</span>
	</button>
	{#if open}
		<div class="espoo-accordion__panel">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.espoo-accordion {
		background-color: var(--backgrounds--accordion);
		border-radius: var(--espoo-radius);
		overflow: hidden;
	}

	.espoo-accordion__trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.125rem 1.375rem;
		background: transparent;
		border: 0;
		cursor: pointer;
		text-align: left;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.125rem;
		line-height: 1.5rem;
		color: var(--typography--linkHeading);
	}

	.espoo-accordion__trigger:hover {
		color: var(--typography--linkHeadingHover);
	}

	.espoo-accordion__trigger:focus-visible {
		outline: 0.125rem solid var(--interactives--primaryOutline);
		outline-offset: -0.25rem;
		border-radius: var(--espoo-radius);
	}

	.espoo-accordion__icon {
		font-size: 1.375rem;
		line-height: 1;
		font-weight: 400;
		flex-shrink: 0;
	}

	.espoo-accordion__panel {
		padding: 0 1.375rem 1.25rem;
		font-family: var(--espoo-font-body);
		font-size: 1rem;
		line-height: 1.625rem;
		color: var(--typography--body);
	}
</style>
