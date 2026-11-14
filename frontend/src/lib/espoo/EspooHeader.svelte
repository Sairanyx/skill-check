<script>
	/**
	 * EspooHeader — Top navigation bar with brand mark, nav links, and optional actions slot.
	 */
	let {
		brand = 'ESPOO',
		brandHref = '/',
		subtitle = '',
		links = [],
		actions = undefined
	} = $props();
</script>

<header class="espoo-header">
	<div class="espoo-header__inner">
		<a href={brandHref} class="espoo-header__brand">
			<span class="espoo-header__logo" aria-hidden="true">E</span>
			<span class="espoo-header__brand-text">
				<span class="espoo-header__brand-name">{brand}</span>
				{#if subtitle}
					<span class="espoo-header__brand-sub">{subtitle}</span>
				{/if}
			</span>
		</a>

		{#if links.length > 0}
			<nav class="espoo-header__nav" aria-label="Primary navigation">
				{#each links as link}
					<a
						href={link.href}
						class="espoo-header__link"
						class:is-active={link.active}
						aria-current={link.active ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		{/if}

		{#if actions}
			<div class="espoo-header__actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>

<style>
	.espoo-header {
		background-color: var(--backgrounds--header);
		border-bottom: 0.125rem solid var(--backgrounds--border);
		padding: var(--spacing--headerPadding) var(--spacing--basicPadding);
	}

	.espoo-header__inner {
		max-width: 76rem;
		margin: 0 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem 2rem;
	}

	.espoo-header__brand {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: var(--typography--header);
	}

	.espoo-header__logo {
		display: inline-grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--espoo-radius-sm);
		background-color: var(--espoo-blue);
		color: #ffffff;
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: 1.25rem;
		letter-spacing: 0.04em;
	}

	.espoo-header__brand-text {
		display: flex;
		flex-direction: column;
	}

	.espoo-header__brand-name {
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: 1.25rem;
		line-height: 1.2;
		letter-spacing: 0.06em;
	}

	.espoo-header__brand-sub {
		font-family: var(--espoo-font-body);
		font-size: 0.75rem;
		color: var(--typography--placeholder);
	}

	.espoo-header__nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
	}

	.espoo-header__link {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.0625rem;
		color: var(--typography--linkHeading);
		text-decoration: none;
		padding: 0.35rem 0.25rem;
		border-bottom: 0.1875rem solid transparent;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.espoo-header__link:hover {
		color: var(--typography--linkHeadingHover);
		border-bottom-color: var(--typography--linkHeadingHover);
	}

	.espoo-header__link.is-active {
		border-bottom-color: var(--interactives--primary);
	}

	.espoo-header__link:focus-visible {
		outline: 0.125rem solid var(--interactives--primaryOutline);
		outline-offset: 0.25rem;
		border-radius: 0.125rem;
	}

	.espoo-header__actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
</style>
