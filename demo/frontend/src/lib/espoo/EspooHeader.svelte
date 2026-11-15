<script>
	import EspooLogo from './EspooLogo.svelte';
	import SkillCheckLogo from '../SkillCheckLogo.svelte';

	/** @type {{ subtitle?: string, links: Array<{ label: string, href: string, active: boolean }> }} */
	let { links } = $props();
</script>

<header class="header">
	<div class="espoo-container header__inner">
		<span class="header__brand">
			<a href="https://www.espoo.fi/en" target="_blank" rel="noreferrer" aria-label="City of Espoo (espoo.fi)"><EspooLogo /></a>
			<a href="#/" class="header__subtitle" aria-label="SkillCheck home"><SkillCheckLogo /></a>
		</span>

		<nav aria-label="Main">
			<span class="group" role="group" aria-label="Demo">
				<span class="group__label">Demo</span>
				{#each links.filter((l) => l.group === 'demo') as link (link.href)}
					<a href={link.href} class:active={link.active} aria-current={link.active ? 'page' : undefined}>{link.label}</a>
				{/each}
			</span>
			{#each links.filter((l) => l.group !== 'demo') as link (link.href)}
				<a href={link.href} class:active={link.active} aria-current={link.active ? 'page' : undefined}>{link.label}</a>
			{/each}
		</nav>
	</div>
</header>

<style>
	.header {
		background-color: #ffffff;
		padding-block: 1.1rem;
		border-bottom: 1px solid var(--espoo-border);
	}

	.header__inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem 2rem;
	}

	.header__brand a {
		color: inherit;
		text-decoration: none;
	}

	.header__brand {
		display: inline-flex;
		align-items: center;
		gap: 0.9rem;
		color: var(--espoo-white);
		text-decoration: none;
	}

	.header__subtitle {
		padding-left: 0.9rem;
		border-left: 1px solid var(--espoo-border-strong);
		font-size: var(--text-base);
	}

	.group {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.35rem 1.1rem;
		border: 1px solid var(--espoo-border);
		border-radius: 2rem;
		background-color: var(--espoo-mist);
	}

	.group__label {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--espoo-text-muted);
	}

	nav {
		align-items: center;
		display: flex;
		gap: 1.75rem;
	}

	nav a {
		color: var(--espoo-white);
		text-decoration: none;
		padding-block: 0.3rem;
		border-bottom: 2px solid transparent;
		transition: color var(--espoo-ease), border-color var(--espoo-ease);
	}

	nav a:hover,
	nav a.active {
		color: var(--espoo-apricot);
		border-bottom-color: var(--espoo-apricot);
	}

	nav a.active {
		font-weight: 600;
	}

	/* Phones: the nav takes its own row and wraps, the links never break mid-label. */
	@media (max-width: 40em) {
		.header {
			padding-block: 0.75rem;
		}

		nav {
			width: 100%;
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
			font-size: var(--text-sm);
		}

		nav a {
			white-space: nowrap;
		}

		.group {
			flex-wrap: wrap;
			gap: 0.25rem 0.9rem;
			padding: 0.3rem 0.8rem;
		}
	}
</style>
