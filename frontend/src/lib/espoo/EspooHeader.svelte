<script>
	import EspooLogo from './EspooLogo.svelte';
	import SkillCheckLogo from '../SkillCheckLogo.svelte';

	/** @type {{ subtitle?: string, links: Array<{ label: string, href: string, active: boolean }> }} */
	let { links } = $props();
</script>

<header class="header">
	<div class="espoo-container header__inner">
		<a href="#/" class="header__brand">
			<EspooLogo />
			<span class="header__subtitle"><SkillCheckLogo /></span>
		</a>

		<nav aria-label="Main">
			{#each links as link (link.href)}
				<a href={link.href} class:active={link.active} aria-current={link.active ? 'page' : undefined}>
					{link.label}
				</a>
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
		font-size: 0.95rem;
	}

	nav {
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
</style>
