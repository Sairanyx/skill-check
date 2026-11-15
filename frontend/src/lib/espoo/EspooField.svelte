<script>
	/** Label + optional hint around a form control that carries the `espoo-input` class. */
	let { label, for: htmlFor, hint = '', children } = $props();
</script>

<div class="field">
	<label for={htmlFor}>{label}</label>
	{#if hint}<span class="espoo-muted field__hint">{hint}</span>{/if}
	{@render children()}
</div>

<style>
	.field {
		display: grid;
		gap: 0.35rem;
	}

	label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.field__hint {
		font-size: 0.85rem;
	}
</style>
