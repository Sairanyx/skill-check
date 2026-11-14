<script>
	/**
	 * EspooAlert — Notice/alert banner matching Espoo's semantic message tokens.
	 * @typedef {'info' | 'note' | 'warning' | 'alert'} Variant
	 */
	let {
		variant = 'info',
		title = '',
		dismissible = false,
		ondismiss = undefined,
		children
	} = $props();

	let dismissed = $state(false);

	function handleDismiss() {
		dismissed = true;
		ondismiss?.();
	}
</script>

{#if !dismissed}
	<div class="espoo-alert espoo-alert--{variant}" role={variant === 'alert' ? 'alert' : 'status'}>
		<div class="espoo-alert__body">
			{#if title}
				<div class="espoo-alert__title">{title}</div>
			{/if}
			<div class="espoo-alert__content">
				{@render children?.()}
			</div>
		</div>
		{#if dismissible}
			<button
				type="button"
				class="espoo-alert__close"
				aria-label="Dismiss notification"
				onclick={handleDismiss}
			>
				✕
			</button>
		{/if}
	</div>
{/if}

<style>
	.espoo-alert {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: var(--espoo-radius);
		border-left: 0.375rem solid transparent;
		font-family: var(--espoo-font-body);
		font-size: 1rem;
		line-height: 1.5rem;
	}

	.espoo-alert--info {
		background-color: var(--espoo-mist);
		border-left-color: var(--espoo-blue);
		color: #000000;
	}

	.espoo-alert--note {
		background-color: var(--espoo-sun);
		border-left-color: var(--espoo-navy);
		color: var(--espoo-navy);
	}

	.espoo-alert--warning {
		background-color: var(--espoo-peach);
		border-left-color: var(--espoo-apricot);
		color: #000000;
	}

	.espoo-alert--alert {
		background-color: var(--espoo-coral);
		border-left-color: #9e1b22;
		color: #ffffff;
	}

	.espoo-alert__title {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.0625rem;
		margin-bottom: 0.25rem;
	}

	.espoo-alert__close {
		background: transparent;
		border: 0.125rem solid transparent;
		border-radius: var(--espoo-radius-sm);
		color: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0.25rem 0.45rem;
		flex-shrink: 0;
	}

	.espoo-alert__close:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.espoo-alert__close:focus-visible {
		outline: 0.125rem solid currentColor;
		outline-offset: 0.125rem;
	}
</style>
