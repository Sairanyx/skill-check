<script>
	import EspooLogo from './EspooLogo.svelte';
	import SkillCheckLogo from '../SkillCheckLogo.svelte';
</script>

<footer class="footer">
	<div class="espoo-container footer__inner">
		<span class="footer__logos"><a href="https://www.espoo.fi/en" target="_blank" rel="noreferrer" aria-label="City of Espoo (espoo.fi)"><EspooLogo /></a><a href="#/" aria-label="SkillCheck home"><SkillCheckLogo light /></a></span>
		<div class="footer__right">
			<p class="footer__text">
				Made at Junction 2026 for the City of Espoo. Synthetic data only. AI: Gemma 4 privacy guard in Finland, then Gemini 4 Hydrogen, Argon and Carbon.
			</p>
			<a class="espoo-arrow-link footer__espoo" href="https://www.espoo.fi/en" target="_blank" rel="noreferrer">espoo.fi</a>
		</div>
	</div>
</footer>

<style>
	.footer__logos a {
		color: inherit;
		text-decoration: none;
	}

	/* Text and the espoo.fi link on one line, the link at the right end */
	.footer__right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1.5rem;
		flex: 1;
	}

	.footer__text {
		max-width: 38rem;
		text-align: right;
	}

	.footer__espoo {
		flex-shrink: 0;
	}

	@media (max-width: 50em) {
		.footer__right {
			flex-direction: column;
			align-items: flex-start;
		}

		.footer__text {
			text-align: left;
		}
	}

	.footer__logos {
		display: inline-flex;
		align-items: center;
		gap: 1.25rem;
	}

	.footer {
		margin-top: auto;
		padding-block: 2.5rem;
		background-color: var(--espoo-deep);
		color: var(--espoo-on-blue);
	}

	.footer__text {
		color: rgba(255, 255, 255, 0.8);
	}

	.footer :global(.espoo-arrow-link) {
		color: var(--espoo-on-blue);
	}

	.footer__inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem 2rem;
		font-size: var(--text-sm);
	}
</style>
