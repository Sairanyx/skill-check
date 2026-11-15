<script>
	/** @type {{ tone?: 'outline' | 'apricot' | 'alert' | 'note' }} */
	let { tone = 'outline', children } = $props();
</script>

<span class="badge badge--{tone}">{@render children()}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		font-size: var(--text-xs);
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
		background-color: var(--espoo-apricot);
		color: var(--espoo-midnight);
	}

	.badge--alert {
		background-color: #fdecec;
		border-color: #f3c4c4;
		color: #9b1c1c;
	}

	.badge--note {
		background-color: #fff6dc;
		border-color: #f1d891;
		color: #6b4e00;
	}
</style>
