<script>
	/** Thin horizontal bar filled to `value` percent. */
	/** @type {{ value: number, tone?: 'apricot' | 'outline' | 'alert', label?: string }} */
	let { value, tone = 'apricot', label = undefined } = $props();
</script>

<div
	class="bar"
	role={label ? 'progressbar' : undefined}
	aria-label={label}
	aria-valuenow={label ? value : undefined}
	aria-valuemin={label ? 0 : undefined}
	aria-valuemax={label ? 100 : undefined}
	aria-hidden={label ? undefined : 'true'}
>
	<span class="bar__fill bar__fill--{tone}" style:width="{value}%"></span>
</div>

<style>
	.bar {
		height: 0.4rem;
		background-color: var(--espoo-mist);
	}

	.bar__fill {
		display: block;
		height: 100%;
		transition: width 0.6s ease;
	}

	.bar__fill--apricot {
		background-color: var(--espoo-apricot);
	}

	.bar__fill--outline {
		background-color: var(--espoo-blue);
	}

	.bar__fill--alert {
		background-color: var(--espoo-coral);
	}
</style>
