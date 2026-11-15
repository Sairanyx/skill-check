<script>
	/**
	 * espoo.fi button: solid white `primary` or white-outline `secondary`.
	 * Pass `href` to render a link that looks like a button.
	 * @type {{ variant?: 'primary' | 'secondary', size?: 'sm' | 'md', href?: string, [key: string]: any }}
	 */
	let { variant = 'primary', size = 'md', href = undefined, type = 'button', children, ...rest } = $props();
</script>

{#if href}
	<a {href} class="btn btn--{variant} btn--{size}" {...rest}>{@render children()}</a>
{:else}
	<button {type} class="btn btn--{variant} btn--{size}" {...rest}>{@render children()}</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		border: 1px solid;
		border-radius: var(--espoo-radius);
		cursor: pointer;
		transition: background-color var(--espoo-ease), color var(--espoo-ease), border-color var(--espoo-ease);
	}

	.btn--md {
		padding: 0.65rem 1.25rem;
	}

	.btn--sm {
		padding: 0.4rem 0.85rem;
		font-size: var(--text-sm);
	}

	.btn--primary {
		background-color: var(--espoo-apricot);
		border-color: var(--espoo-apricot);
		color: var(--espoo-on-blue);
		font-family: var(--espoo-font-heading);
		font-weight: 700;
	}

	.btn--secondary {
		background-color: transparent;
		border-color: var(--espoo-border-strong);
		color: var(--espoo-white);
		font-weight: 400;
	}

	.btn:hover:not(:disabled) {
		background-color: #00245a;
		border-color: #00245a;
		color: var(--espoo-on-blue);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
