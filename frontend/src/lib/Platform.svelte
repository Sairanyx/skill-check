<script>
	import { EspooBadge, EspooCard } from './espoo/index.js';

	const PORTALS = [
		{
			title: 'Jobseeker',
			badge: 'EXAM Room',
			text: 'Book a 20-minute supervised skill check in Finnish, Swedish, or English. No CV needed — only how you solve real problems.',
			action: 'Start a skill check',
			href: '#/'
		},
		{
			title: 'Company',
			badge: 'Employer',
			text: 'Post real work scenarios, review pseudonymized evidence backed by exact quotes, and choose whom to meet.',
			action: 'Inspect sample results',
			href: '#review'
		},
		{
			title: 'City of Espoo',
			badge: 'Authority',
			text: 'Host recruitment events, supervise EXAM terminals, and oversee an immutable EU AI Act audit trail.',
			action: 'Watch 2-min demo',
			href: '#demo'
		}
	];

	const TRUST = [
		'Gemma 4 on Verda GPUs in Finland strips name, origin, and age into a pseudonym before any scoring.',
		'Supervised Finnish EXAM room model (used across 29 Finnish universities): no phone, no ChatGPT.',
		'AI gathers evidence and quotes; human employers always make the final call.',
		'Contact details stay with the City of Espoo until mutual consent (GDPR Art. 5 + EU AI Act).'
	];
</script>

<section class="espoo-container platform-wrap">
	<header class="platform-header">
		<p class="platform-eyebrow">SkillCheck Platform</p>
		<h1>Three portals, one fair hiring flow</h1>
		<p class="espoo-muted platform-lead">
			Built for the City of Espoo employment services: verified skill checks for jobseekers, evidence for employers, and full oversight for the City.
		</p>
	</header>

	<div class="portal-grid">
		{#each PORTALS as p (p.title)}
			<EspooCard>
				<div class="portal-card">
					<div class="portal-card__top">
						<h2>{p.title}</h2>
						<EspooBadge tone="apricot">{p.badge}</EspooBadge>
					</div>
					<p class="espoo-muted">{p.text}</p>
					<a class="espoo-arrow-link" href={p.href}>{p.action}</a>
				</div>
			</EspooCard>
		{/each}
	</div>

	<section class="trust-box">
		<h2>Privacy & EU AI Act by design</h2>
		<ul class="trust-list">
			{#each TRUST as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</section>
</section>

<style>
	.platform-wrap {
		padding-block: 2.5rem 4rem;
		display: grid;
		gap: 2.5rem;
	}

	.platform-header {
		display: grid;
		gap: 0.65rem;
		max-width: 44rem;
	}

	.platform-eyebrow {
		font-family: var(--espoo-font-heading);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--espoo-apricot);
	}

	.platform-lead {
		font-size: 1.05rem;
		line-height: 1.6;
	}

	.portal-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1.25rem;
	}

	.portal-card {
		display: grid;
		gap: 0.9rem;
		align-content: space-between;
		height: 100%;
	}

	.portal-card__top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.portal-card h2 {
		color: var(--espoo-apricot);
		font-size: 1.35rem;
		font-weight: 700;
	}

	.trust-box {
		padding: 1.75rem 2rem;
		background-color: var(--espoo-midnight);
		border-left: 3px solid var(--espoo-apricot);
		display: grid;
		gap: 1rem;
	}

	.trust-list {
		margin: 0;
		padding-left: 1.25rem;
		display: grid;
		gap: 0.6rem;
		color: var(--espoo-text-muted);
	}
</style>
