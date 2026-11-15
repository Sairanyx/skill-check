<script>
	import EspooLogo from './EspooLogo.svelte';
</script>

<footer class="footer">
	<div class="espoo-container footer__inner">
		<EspooLogo />
		<p class="footer__text">
			SkillCheck EXAM — a City of Espoo recruitment pilot. Synthetic data only. Junction 2026.
		</p>
		<a class="espoo-arrow-link footer__link" href="https://www.espoo.fi/en">espoo.fi</a>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
		padding-block: 2.5rem;
		background-color: var(--espoo-navy);
		color: var(--espoo-white);
	}

	.footer__text {
		color: rgba(255, 255, 255, 0.8);
	}

	.footer :global(.footer__link) {
		color: var(--espoo-white);
	}

	.footer :global(.footer__link:hover::before) {
		background-color: var(--espoo-white);
		color: var(--espoo-navy);
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
