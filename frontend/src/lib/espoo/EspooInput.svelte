<script>
	/**
	 * EspooInput — Accessible text, search, email, or multiline input using Work Sans.
	 */
	let {
		label = '',
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		hint = '',
		error = '',
		required = false,
		disabled = false,
		multiline = false,
		rows = 4,
		id = undefined,
		...rest
	} = $props();

	const fallbackId = `espoo-input-${Math.random().toString(36).slice(2, 9)}`;
	let inputId = $derived(id ?? fallbackId);
</script>

<div class="espoo-field" class:espoo-field--error={Boolean(error)}>
	{#if label}
		<label class="espoo-field__label" for={inputId}>
			{label}
			{#if required}
				<span class="espoo-field__req" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	{#if hint}
		<div class="espoo-field__hint" id={`${inputId}-hint`}>{hint}</div>
	{/if}

	{#if multiline}
		<textarea
			id={inputId}
			bind:value
			{placeholder}
			{required}
			{disabled}
			{rows}
			class="espoo-input"
			aria-invalid={Boolean(error)}
			aria-describedby={hint ? `${inputId}-hint` : undefined}
			{...rest}
		></textarea>
	{:else}
		<input
			id={inputId}
			bind:value
			{type}
			{placeholder}
			{required}
			{disabled}
			class="espoo-input"
			aria-invalid={Boolean(error)}
			aria-describedby={hint ? `${inputId}-hint` : undefined}
			{...rest}
		/>
	{/if}

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

	.espoo-field__req {
		color: var(--accents--alert);
		margin-left: 0.2rem;
	}

	.espoo-field__hint {
		font-family: var(--espoo-font-body);
		font-size: 0.875rem;
		line-height: 1.3rem;
		color: var(--typography--placeholder);
	}

	.espoo-input {
		font-family: var(--espoo-font-body);
		font-weight: 400;
		font-size: 1.0625rem;
		line-height: 1.5rem;
		color: var(--typography--body);
		background-color: var(--backgrounds--formElement);
		border: 0.125rem solid var(--accents--strong);
		border-radius: var(--espoo-radius-sm);
		padding: 0.625rem 0.875rem;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.espoo-input::placeholder {
		color: var(--typography--placeholder);
	}

	.espoo-input:focus {
		outline: none;
		border-color: var(--interactives--primary);
		box-shadow: 0 0 0 0.1875rem rgba(0, 80, 187, 0.25);
	}

	.espoo-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.espoo-field--error .espoo-input {
		border-color: var(--accents--alert);
	}

	.espoo-field--error .espoo-input:focus {
		box-shadow: 0 0 0 0.1875rem rgba(255, 79, 87, 0.25);
	}

	.espoo-field__error {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.875rem;
		color: var(--accents--alert);
	}
</style>
