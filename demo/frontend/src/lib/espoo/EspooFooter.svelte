<script>
	import EspooLogo from './EspooLogo.svelte';
	import SkillCheckLogo from '../SkillCheckLogo.svelte';
</script>

<footer class="footer">
	<div class="espoo-container">
		<div class="footer__top">
			<span class="footer__logos">
				<a href="https://www.espoo.fi/en" target="_blank" rel="noreferrer" aria-label="City of Espoo (espoo.fi)"><EspooLogo /></a>
				<a href="#/" aria-label="SkillCheck home"><SkillCheckLogo light /></a>
			</span>
			<a class="espoo-arrow-link footer__espoo" href="https://www.espoo.fi/en" target="_blank" rel="noreferrer">espoo.fi</a>
		</div>
		<p class="footer__text">
			Made at Junction 2026 for Espoo. Synthetic data only. AI: Gemma 4 privacy guard in Finland, then Gemini 4 Hydrogen, Argon and Carbon.
		</p>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
		padding-block: 2.5rem;
		background-color: var(--espoo-deep);
		color: var(--espoo-on-blue);
	}

	.footer__top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
	}

	.footer__logos {
		display: inline-flex;
		align-items: center;
		gap: 1.25rem;
	}

	.footer__logos a {
		color: inherit;
		text-decoration: none;
	}

	.footer :global(.espoo-arrow-link) {
		color: var(--espoo-on-blue);
	}

	.footer__text {
		padding-top: 1.25rem;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.75);
	}
</style>
