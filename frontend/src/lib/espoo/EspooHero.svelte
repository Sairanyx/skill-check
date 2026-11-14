<script>
	/**
	 * EspooHero — Signature Espoo Blue (#0050bb) hero banner with Lato H1 & Work Sans lead.
	 */
	let {
		eyebrow = '',
		title,
		lead = '',
		actions = undefined,
		children = undefined
	} = $props();
</script>

<section class="espoo-hero">
	<div class="espoo-hero__inner">
		{#if eyebrow}
			<div class="espoo-hero__eyebrow">{eyebrow}</div>
		{/if}
		<h1 class="espoo-hero__title">{title}</h1>
		{#if lead}
			<p class="espoo-hero__lead">{lead}</p>
		{/if}
		{#if children}
			<div class="espoo-hero__extra">
				{@render children()}
			</div>
		{/if}
		{#if actions}
			<div class="espoo-hero__actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</section>

<style>
	.espoo-hero {
		background-color: var(--backgrounds--hero);
		color: var(--typography--bodyOnThemeColor);
		padding: 3rem var(--spacing--basicPadding);
	}

	@media all and (min-width: 60em) {
		.espoo-hero {
			padding: 4.5rem var(--spacing--basicPadding);
		}
	}

	.espoo-hero__inner {
		max-width: 76rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.espoo-hero__eyebrow {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--espoo-apricot);
	}

	.espoo-hero__title {
		font-family: var(--espoo-font-heading);
		font-weight: 400;
		font-size: 2rem;
		line-height: 2.5rem;
		color: #ffffff;
		margin: 0;
		max-width: 48rem;
	}

	@media all and (min-width: 60em) {
		.espoo-hero__title {
			font-size: 2.75rem;
			line-height: 3.375rem;
		}
	}

	.espoo-hero__lead {
		font-family: var(--espoo-font-body);
		font-size: 1.125rem;
		line-height: 1.75rem;
		margin: 0;
		max-width: 44rem;
		color: rgba(255, 255, 255, 0.94);
	}

	@media all and (min-width: 60em) {
		.espoo-hero__lead {
			font-size: 1.25rem;
			line-height: 1.875rem;
		}
	}

	.espoo-hero__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.875rem;
		margin-top: 0.5rem;
	}
</style>
