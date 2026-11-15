<script>
	/**
	 * espoo.fi split hero: royal-blue text column with the wavy edge on the left,
	 * a midnight panel (`aside`) on the right.
	 */
	let { title, lead, actions = undefined, aside } = $props();
</script>

<section class="hero">
	<div class="hero__text">
		<div class="hero__text-inner">
			<h1>{title}</h1>
			<p>{lead}</p>
			{#if actions}
				<div class="hero__actions">
					{@render actions()}
				</div>
			{/if}
		</div>
		<svg class="hero__wave" viewBox="0 0 110 420" preserveAspectRatio="none" aria-hidden="true">
			<path
				d="M0,0 L48,0 C30,28 65,62 42,102 C18,144 55,188 34,238 C14,285 45,322 62,360 C78,392 98,408 110,420 L0,420 Z"
			/>
		</svg>
	</div>
	<div class="hero__aside">
		{@render aside()}
	</div>
</section>

<style>
	.hero {
		display: grid;
		background-color: var(--espoo-navy);
		color: var(--espoo-white);
	}

	.hero :global(.espoo-arrow-link) {
		color: var(--espoo-white);
	}

	.hero :global(.espoo-arrow-link:hover) {
		color: var(--espoo-tint);
	}

	.hero :global(.espoo-arrow-link:hover::before) {
		background-color: var(--espoo-white);
		color: var(--espoo-blue);
	}

	.hero :global(.btn--primary) {
		background-color: var(--espoo-white);
		border-color: var(--espoo-white);
		color: var(--espoo-blue);
	}

	.hero :global(.btn--primary:hover:not(:disabled)) {
		background-color: var(--espoo-tint);
		border-color: var(--espoo-tint);
		color: var(--espoo-blue);
	}

	@media (min-width: 58em) {
		.hero {
			grid-template-columns: 1fr 1fr;
		}
	}

	.hero__text {
		position: relative;
		display: flex;
		justify-content: flex-end;
		padding: 3rem var(--espoo-gutter);
		background-color: var(--espoo-blue);
	}

	.hero__text-inner {
		max-width: 32rem;
		display: grid;
		gap: 1rem;
	}

	.hero__text p {
		font-size: 1.0625rem;
	}

	.hero__actions {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.9rem;
	}

	.hero__wave {
		display: none;
	}

	@media (min-width: 58em) {
		.hero__text {
			padding-right: 3rem;
		}

		.hero__wave {
			display: block;
			position: absolute;
			top: 0;
			right: -68px;
			width: 70px;
			height: 100%;
			fill: var(--espoo-blue);
		}
	}

	.hero__aside {
		display: flex;
		align-items: center;
		padding: 2.5rem var(--espoo-gutter);
	}

	@media (min-width: 58em) {
		.hero__aside {
			padding-left: 6rem;
		}
	}
</style>
