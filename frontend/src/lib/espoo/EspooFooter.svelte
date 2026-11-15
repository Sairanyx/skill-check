<script>
	import EspooLogo from './EspooLogo.svelte';
	import SkillCheckLogo from '../SkillCheckLogo.svelte';
</script>

<footer class="footer">
	<div class="espoo-container footer__inner">
		<span class="footer__logos"><EspooLogo /><SkillCheckLogo light /></span>
		<p class="footer__text">
			Made at Junction 2026 for the City of Espoo. Synthetic data only. AI: Gemini 4 Hydrogen, Argon and Carbon.
		</p>
		<a class="espoo-arrow-link" href="https://www.espoo.fi/en">espoo.fi</a>
	</div>
</footer>

<style>
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
		font-size: 0.9rem;
	}
</style>
