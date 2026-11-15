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
		font-size: var(--text-base);
		border-radius: var(--espoo-radius);
	}

	strong {
		font-family: var(--espoo-font-heading);
	}

	.alert--info {
		background-color: #f5f8fd;
		border-color: var(--espoo-apricot);
	}

	.alert--note {
		background-color: #fff8e6;
		border-color: #d9a400;
		color: #0b1b33;
	}

	.alert--alert {
		background-color: #fdecec;
		border-color: #d64545;
		color: #0b1b33;
	}
</style>
