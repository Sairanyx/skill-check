<script>
	/**
	 * EspooFooter — Signature Espoo Blue (#0050bb) footer with link columns & legal bar.
	 */
	let {
		brand = 'City of Espoo UI',
		tagline = 'Accessible, clear public-sector typography and color system.',
		columns = [],
		copyright = '© 2026 SkillCheck Booth · Styled after espoo.fi'
	} = $props();
</script>

<footer class="espoo-footer">
	<div class="espoo-footer__inner">
		<div class="espoo-footer__grid">
			<div class="espoo-footer__brand">
				<div class="espoo-footer__brand-title">{brand}</div>
				{#if tagline}
					<p class="espoo-footer__tagline">{tagline}</p>
				{/if}
			</div>

			{#each columns as col}
				<div class="espoo-footer__col">
					<h3 class="espoo-footer__col-title">{col.title}</h3>
					<ul class="espoo-footer__list">
						{#each col.links as link}
							<li>
								<a href={link.href} class="espoo-footer__link">{link.label}</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div class="espoo-footer__bottom">
			<span>{copyright}</span>
		</div>
	</div>
</footer>

<style>
	.espoo-footer {
		background-color: var(--backgrounds--footer);
		color: var(--typography--bodyOnThemeColor);
		padding: var(--spacing--footerPadding) var(--spacing--basicPadding) 2rem;
		font-family: var(--espoo-font-body);
	}

	.espoo-footer__inner {
		max-width: 76rem;
		margin: 0 auto;
	}

	.espoo-footer__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.25);
	}

	.espoo-footer__brand-title {
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: 1.25rem;
		letter-spacing: 0.04em;
		margin-bottom: 0.5rem;
	}

	.espoo-footer__tagline {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5rem;
		color: rgba(255, 255, 255, 0.88);
	}

	.espoo-footer__col-title {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.0625rem;
		color: #ffffff;
		margin: 0 0 0.75rem;
	}

	.espoo-footer__list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.espoo-footer__link {
		color: #ffffff;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		font-size: 0.9375rem;
	}

	.espoo-footer__link:hover {
		color: var(--typography--linkHeadingHoverOnThemeColor);
		text-decoration: none;
	}

	.espoo-footer__link:focus-visible {
		outline: 0.125rem solid var(--espoo-apricot);
		outline-offset: 0.125rem;
	}

	.espoo-footer__bottom {
		padding-top: 1.5rem;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.82);
	}
</style>
