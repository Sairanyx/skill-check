<script>
	/**
	 * EspooBadge — Compact category/status pill using Espoo's thematic palette.
	 * @typedef {'blue' | 'navy' | 'mist' | 'peach' | 'apricot' | 'blossom' | 'alert' | 'note'} Variant
	 */
	let { variant = 'mist', children } = $props();
</script>

<span class="espoo-badge espoo-badge--{variant}">
	{@render children?.()}
</span>

<style>
	.espoo-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.8125rem;
		line-height: 1.125rem;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		letter-spacing: 0.01em;
	}

	.espoo-badge--blue {
		background-color: var(--espoo-blue);
		color: #ffffff;
	}

	.espoo-badge--navy {
		background-color: var(--espoo-navy);
		color: #ffffff;
	}

	.espoo-badge--mist {
		background-color: var(--espoo-mist);
		color: #000000;
	}

	.espoo-badge--peach {
		background-color: var(--espoo-peach);
		color: #000000;
	}

	.espoo-badge--apricot {
		background-color: var(--espoo-apricot);
		color: #000000;
	}

	.espoo-badge--blossom {
		background-color: var(--espoo-blossom);
		color: #000000;
	}

	.espoo-badge--alert {
		background-color: var(--espoo-coral);
		color: #ffffff;
	}

	.espoo-badge--note {
		background-color: var(--espoo-sun);
		color: var(--espoo-navy);
	}
</style>
