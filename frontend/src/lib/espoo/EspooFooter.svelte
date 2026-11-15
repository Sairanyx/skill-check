<script>
	import EspooLogo from './EspooLogo.svelte';
</script>

<footer class="footer">
	<div class="espoo-container footer__inner">
		<EspooLogo />
		<p class="espoo-muted">
			SkillCheck Booth — a City of Espoo recruitment pilot. Synthetic data only. Junction 2026.
		</p>
		<a class="espoo-arrow-link" href="https://www.espoo.fi/en">espoo.fi</a>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
		padding-block: 2.5rem;
		background-color: var(--espoo-midnight);
		border-top: 1px solid var(--espoo-border);
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
