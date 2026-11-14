<script>
	/**
	 * EspooButton — Lato-typed action button or link-button with Espoo focus ring.
	 * @typedef {'primary' | 'secondary' | 'navy' | 'ghost' | 'alert'} Variant
	 * @typedef {'sm' | 'md' | 'lg'} Size
	 */
	let {
		variant = 'primary',
		size = 'md',
		href = undefined,
		type = 'button',
		disabled = false,
		onclick = undefined,
		children,
		...rest
	} = $props();
</script>

{#if href && !disabled}
	<a
		{href}
		class="espoo-btn espoo-btn--{variant} espoo-btn--{size}"
		{onclick}
		{...rest}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class="espoo-btn espoo-btn--{variant} espoo-btn--{size}"
		{onclick}
		{...rest}
	>
		{@render children?.()}
	</button>
{/if}

<style>
	.espoo-btn {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.25rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 0.125rem solid transparent;
		border-radius: var(--espoo-radius);
		cursor: pointer;
		text-decoration: none;
		box-sizing: border-box;
		position: relative;
		transition:
			background-color 0.15s ease-in-out,
			color 0.15s ease-in-out,
			border-color 0.15s ease-in-out;
	}

	@media all and (min-width: 60em) {
		.espoo-btn {
			font-size: 1.125rem;
			line-height: 1.4375rem;
		}
	}

	/* Sizes */
	.espoo-btn--sm {
		padding: 0.4375rem 1rem;
		font-size: 0.9375rem;
	}

	.espoo-btn--md {
		padding: 0.6875rem 1.375rem;
	}

	.espoo-btn--lg {
		padding: 0.9375rem 1.875rem;
	}

	/* Variants */
	.espoo-btn--primary {
		background-color: var(--interactives--primary);
		border-color: var(--interactives--primary);
		color: var(--interactives--primaryForeground);
	}

	.espoo-btn--primary:hover:not(:disabled) {
		background-color: var(--interactives--primaryHover);
		border-color: var(--interactives--primaryHover);
		color: var(--interactives--primaryHoverForeground);
	}

	.espoo-btn--secondary {
		background-color: transparent;
		border-color: var(--typography--linkDefault);
		color: var(--typography--linkDefault);
	}

	.espoo-btn--secondary:hover:not(:disabled) {
		background-color: var(--interactives--primary);
		border-color: var(--interactives--primary);
		color: var(--interactives--primaryForeground);
	}

	.espoo-btn--navy {
		background-color: var(--espoo-navy);
		border-color: var(--espoo-navy);
		color: #ffffff;
	}

	.espoo-btn--navy:hover:not(:disabled) {
		background-color: var(--espoo-blue);
		border-color: var(--espoo-blue);
	}

	.espoo-btn--ghost {
		background-color: transparent;
		border-color: transparent;
		color: var(--typography--linkHeading);
	}

	.espoo-btn--ghost:hover:not(:disabled) {
		background-color: var(--backgrounds--accordion);
	}

	.espoo-btn--alert {
		background-color: var(--accents--alert);
		border-color: var(--accents--alert);
		color: #ffffff;
	}

	.espoo-btn--alert:hover:not(:disabled) {
		background-color: #d93840;
		border-color: #d93840;
	}

	.espoo-btn:disabled {
		background-color: var(--interactives--primaryDisabledBackground);
		border-color: transparent;
		color: var(--interactives--primaryDisabledForeground);
		cursor: not-allowed;
	}

	/* Signature Espoo double-offset focus ring */
	.espoo-btn:focus-visible {
		outline: none;
	}

	.espoo-btn:focus-visible::before {
		content: '';
		position: absolute;
		inset: -0.375rem;
		border: 0.125rem solid var(--interactives--primaryOutline);
		border-radius: calc(var(--espoo-radius) + 0.25rem);
		pointer-events: none;
	}
</style>
