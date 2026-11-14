<script>
	/**
	 * EspooSelect — Accessible dropdown select styled with Espoo tokens.
	 */
	let {
		label = '',
		value = $bindable(''),
		options = [],
		hint = '',
		error = '',
		disabled = false,
		id = undefined,
		...rest
	} = $props();

	const fallbackId = `espoo-select-${Math.random().toString(36).slice(2, 9)}`;
	let selectId = $derived(id ?? fallbackId);
</script>

<div class="espoo-field" class:espoo-field--error={Boolean(error)}>
	{#if label}
		<label class="espoo-field__label" for={selectId}>{label}</label>
	{/if}
	{#if hint}
		<div class="espoo-field__hint">{hint}</div>
	{/if}
	<select
		id={selectId}
		bind:value
		{disabled}
		class="espoo-select"
		aria-invalid={Boolean(error)}
		{...rest}
	>
		{#each options as opt}
			{#if typeof opt === 'string'}
				<option value={opt}>{opt}</option>
			{:else}
				<option value={opt.value}>{opt.label}</option>
			{/if}
		{/each}
	</select>
	{#if error}
		<div class="espoo-field__error" role="alert">{error}</div>
	{/if}
</div>

<style>
	.espoo-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.espoo-field__label {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.4rem;
		color: var(--typography--header);
	}

	.espoo-field__hint {
		font-family: var(--espoo-font-body);
		font-size: 0.875rem;
		color: var(--typography--placeholder);
	}

	.espoo-select {
		font-family: var(--espoo-font-body);
		font-size: 1.0625rem;
		line-height: 1.5rem;
		color: var(--typography--body);
		background-color: var(--backgrounds--formElement);
		border: 0.125rem solid var(--accents--strong);
		border-radius: var(--espoo-radius-sm);
		padding: 0.625rem 0.875rem;
		width: 100%;
		box-sizing: border-box;
		cursor: pointer;
	}

	.espoo-select:focus {
		outline: none;
		border-color: var(--interactives--primary);
		box-shadow: 0 0 0 0.1875rem rgba(0, 80, 187, 0.25);
	}

	.espoo-field--error .espoo-select {
		border-color: var(--accents--alert);
	}

	.espoo-field__error {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.875rem;
		color: var(--accents--alert);
	}
</style>
