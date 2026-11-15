<script>
	/** @type {{ tone?: 'outline' | 'apricot' | 'alert' | 'note' }} */
	let { tone = 'outline', children } = $props();
</script>

<span class="badge badge--{tone}">{@render children()}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.3rem;
		white-space: nowrap;
		border: 1px solid transparent;
		border-radius: var(--espoo-radius);
	}

	.badge--outline {
		border-color: var(--espoo-border-strong);
	}

	.badge--apricot {
		background-color: var(--espoo-tint);
		color: var(--espoo-blue);
	}

	.badge--alert {
		background-color: var(--espoo-coral);
		color: var(--espoo-white);
	}

	.badge--note {
		background-color: var(--espoo-sun);
		color: var(--espoo-ink);
	}
</style>
