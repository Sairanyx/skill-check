<script>
	/**
	 * EspooCard — Content block supporting Espoo's thematic & neutral surface colors.
	 * @typedef {'default' | 'mist' | 'peach' | 'apricot' | 'blossom' | 'blue' | 'navy'} Variant
	 */
	let {
		variant = 'default',
		title = '',
		eyebrow = '',
		href = undefined,
		elevated = false,
		footer = undefined,
		children
	} = $props();
</script>

<article class="espoo-card espoo-card--{variant}" class:espoo-card--elevated={elevated}>
	{#if eyebrow}
		<div class="espoo-card__eyebrow">{eyebrow}</div>
	{/if}
	{#if title}
		<h3 class="espoo-card__title">
			{#if href}
				<a {href} class="espoo-card__link">{title}</a>
			{:else}
				{title}
			{/if}
		</h3>
	{/if}
	<div class="espoo-card__body">
		{@render children?.()}
	</div>
	{#if footer}
		<div class="espoo-card__footer">
			{@render footer()}
		</div>
	{/if}
</article>

<style>
	.espoo-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		border-radius: var(--espoo-radius);
		border: 0.125rem solid transparent;
		font-family: var(--espoo-font-body);
		box-sizing: border-box;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.espoo-card--elevated {
		box-shadow: var(--shadows--default);
	}

	.espoo-card--default {
		background-color: var(--backgrounds--block);
		border-color: var(--backgrounds--border);
		color: var(--typography--body);
	}

	.espoo-card--mist {
		background-color: var(--espoo-mist);
		color: #000000;
	}

	.espoo-card--peach {
		background-color: var(--espoo-peach);
		color: #000000;
	}

	.espoo-card--apricot {
		background-color: var(--espoo-apricot);
		color: #000000;
	}

	.espoo-card--blossom {
		background-color: var(--espoo-blossom);
		color: #000000;
	}

	.espoo-card--blue {
		background-color: var(--espoo-blue);
		color: #ffffff;
	}

	.espoo-card--navy {
		background-color: var(--espoo-navy);
		color: #ffffff;
	}

	.espoo-card__eyebrow {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.8125rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.85;
	}

	.espoo-card__title {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.25rem;
		line-height: 1.625rem;
		margin: 0;
		color: inherit;
	}

	.espoo-card--default .espoo-card__title {
		color: var(--typography--linkHeading);
	}

	.espoo-card__link {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.espoo-card__link:hover {
		text-decoration: none;
	}

	.espoo-card__link:focus-visible {
		outline: 0.125rem solid currentColor;
		outline-offset: 0.1875rem;
		border-radius: 0.125rem;
	}

	.espoo-card__body {
		font-size: 1rem;
		line-height: 1.55rem;
		flex: 1;
	}

	.espoo-card__footer {
		margin-top: 0.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}
</style>
