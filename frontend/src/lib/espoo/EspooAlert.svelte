<script>
	/** Notice banner. `alert` is for errors, `note` for things a reviewer should look at. */
	/** @type {{ variant?: 'info' | 'note' | 'alert', title?: string }} */
	let { variant = 'info', title = '', children } = $props();
</script>

<div class="alert alert--{variant}" role={variant === 'alert' ? 'alert' : 'status'}>
	{#if title}<strong>{title}</strong>{/if}
	<div>{@render children()}</div>
</div>

<style>
	.alert {
		display: grid;
		gap: 0.2rem;
		padding: 0.9rem 1.15rem;
		border-left: 0.3rem solid;
		font-size: 0.95rem;
	}

	strong {
		font-family: var(--espoo-font-heading);
	}

	.alert--info {
		background-color: var(--espoo-midnight);
		border-color: var(--espoo-apricot);
	}

	.alert--note {
		background-color: var(--espoo-sun);
		border-color: var(--espoo-navy);
		color: var(--espoo-midnight);
	}

	.alert--alert {
		background-color: var(--espoo-coral);
		border-color: var(--espoo-midnight);
	}
</style>
