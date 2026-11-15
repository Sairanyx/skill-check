<script>
	import { onMount } from 'svelte';
	import { EspooBadge, EspooBar, EspooButton } from './espoo/index.js';

	const STEPS = [
		{
			id: 'exam-rooms',
			title: 'City of Espoo + supervised EXAM rooms',
			text: 'Espoo serves ~30,000 jobseekers and runs TalentMatch events. Instead of AI-written CVs or cheatable remote tests, candidates take a 20-minute skill check on a supervised City EXAM computer — the same trusted model 29 Finnish universities use.',
			places: ['city', 'jobseeker', 'exam'],
			refs: [
				{
					text: 'Since the TE24 reform (1 Jan 2025), Espoo is the employment authority for ~30,000 jobseekers.',
					source: 'Työmarkkinatori',
					href: 'https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle'
				},
				{
					text: 'Finnish universities already run booked, supervised EXAM rooms in 29 institutions.',
					source: 'Aalto University',
					href: 'https://www.aalto.fi/en/services/electronic-examinations-exam-service'
				},
				{
					text: 'An analysis of ~20,000 remote AI interviews flagged 38.5% for cheating; Google, McKinsey and Cisco brought back in-person rounds.',
					source: 'Fabric / Entrepreneur',
					href: 'https://www.entrepreneur.com/business-news/google-mckinsey-reintroduce-in-person-interviews-due-to-ai/496041'
				}
			]
		},
		{
			id: 'gemma-pseudonyms',
			title: 'Gemma strips bias into pseudonyms',
			text: 'Before any scoring model or company sees an answer, Gemma 4 running locally on Verda GPUs in Finland strips name, employer, school, origin, age, and contact details — replacing them with a pseudonym like Candidate #A-419.',
			places: ['exam'],
			refs: [
				{
					text: 'Language models rank identical CVs differently by name.',
					source: 'CUHK audit of 14 LLMs, 2026',
					href: 'https://arxiv.org/pdf/2606.28978'
				},
				{
					text: 'Anonymous recruitment raised hiring of applicants with foreign names in the City of Helsinki when set as the default.',
					source: 'VATT & LABORE 2023',
					href: 'https://labore.fi/en/publications/anatomy-of-an-anonymous-hiring-pilot/'
				}
			]
		},
		{
			id: 'ai-panel',
			title: 'Three-model AI panel probes real skill',
			text: 'Three independent models deliberate after each answer in Finnish, Swedish, or English — agreeing on the next follow-up question to test practical problem solving rather than buzzwords.',
			places: ['jobseeker', 'exam'],
			url: 'skillcheck.fi/en/exam',
			who: 'EXAM Room · Candidate #A-419',
			refs: [
				{
					text: 'Structured interviews about real job tasks are the single best predictor of job performance.',
					source: 'Sackett et al. 2022',
					href: 'https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance'
				},
				{
					text: 'A panel of AI judges from different model families agrees better with humans than one large judge.',
					source: 'Verga et al. 2024',
					href: 'https://arxiv.org/pdf/2404.18796'
				}
			]
		},
		{
			id: 'people-decide',
			title: 'Evidence report — people decide',
			text: 'Companies review pseudonymized skill scores backed by exact quotes from the candidate’s own words and invite whom to meet for 15-minute TalentMatch interviews. Every access is logged for the City.',
			places: ['company', 'city'],
			url: 'skillcheck.fi/en/results',
			who: 'Employer · TalentMatch',
			refs: [
				{
					text: 'Espoo TalentMatch events bring 200–1,000 jobseekers and 5–50 employers together in 15-minute meetings.',
					source: 'City of Espoo',
					href: 'https://www.espoo.fi/en/talentmatch-events'
				},
				{
					text: 'Recruitment AI is high-risk under the EU AI Act, so human oversight and audit logging are built in from the start.',
					source: 'DLA Piper / World Bank',
					href: 'https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act'
				}
			]
		}
	];

	const PLACES = [
		{ id: 'city', label: 'City of Espoo' },
		{ id: 'jobseeker', label: 'Jobseeker' },
		{ id: 'exam', label: 'EXAM room + Gemma' },
		{ id: 'company', label: 'Company' }
	];

	const STRIPPED = ['name', 'employer', 'school', 'origin', 'age', 'place', 'year', 'contact'];

	let index = $state(0);
	const step = $derived(STEPS[index]);

	function go(n) {
		index = Math.max(0, Math.min(STEPS.length - 1, n));
	}

	onMount(() => {
		const onKey = (e) => {
			if (e.target.closest('input, textarea, select')) return;
			if (e.key === 'ArrowRight') go(index + 1);
			if (e.key === 'ArrowLeft') go(index - 1);
		};
		addEventListener('keydown', onKey);
		return () => removeEventListener('keydown', onKey);
	});
</script>

<section class="espoo-container demo-wrap">
	<header class="demo-header">
		<div>
			<p class="demo-eyebrow">Interactive Demo · 4 Steps</p>
			<h1>SkillCheck EXAM in two minutes</h1>
		</div>
		<p class="espoo-muted demo-lead">
			Supervised Finnish EXAM rooms + Gemma 4 pseudonyms in Finland + human hiring decisions.
		</p>
	</header>

	<nav class="demo-progress" aria-label="Demo steps">
		{#each STEPS as s, n (s.id)}
			<button
				type="button"
				class="demo-step-btn"
				class:active={n === index}
				class:done={n <= index}
				onclick={() => go(n)}
				aria-current={n === index ? 'step' : undefined}
			>
				<span class="demo-step-bar"></span>
				<span class="demo-step-num">{n + 1}. {s.title}</span>
			</button>
		{/each}
	</nav>

	{#key index}
		<div class="demo-stage">
			<div class="demo-copy demo-rise">
				<span class="demo-counter">{index + 1} / {STEPS.length}</span>
				<h2>{step.title}</h2>
				<p class="demo-text">{step.text}</p>
				<ul class="demo-refs">
					{#each step.refs as r, n (r.source)}
						<li class="demo-rise" style="animation-delay: {0.15 + n * 0.12}s">
							<strong>Evidence:</strong> {r.text}
							<a href={r.href} target="_blank" rel="noreferrer">{r.source} ↗</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="demo-visual">
				<div class="minimap" aria-label="Active actors">
					{#each PLACES as p, n (p.id)}
						{#if n > 0}<span class="minimap__line" aria-hidden="true"></span>{/if}
						<span class="minimap__pill" class:on={step.places.includes(p.id)}>{p.label}</span>
					{/each}
				</div>

				{#if step.id === 'exam-rooms'}
					<div class="big-picture">
						<div class="bp-node bp-node--city demo-pop" style="animation-delay: 0.05s">
							<strong>City of Espoo</strong>
							<span>TalentMatch events · 29-institution Finnish EXAM room model</span>
						</div>
						<div class="bp-arrows">
							<span class="bp-vline demo-grow-y" style="animation-delay: 0.25s"></span>
							<span class="bp-vline demo-grow-y" style="animation-delay: 0.35s"></span>
						</div>
						<div class="bp-row">
							<div class="bp-node demo-pop" style="animation-delay: 0.4s">
								<strong>Jobseeker</strong>
								<span>No CV · books EXAM slot</span>
							</div>
							<span class="bp-hline demo-grow" style="animation-delay: 0.55s"></span>
							<div class="bp-node bp-node--accent demo-pop" style="animation-delay: 0.65s">
								<strong>EXAM room + Gemma</strong>
								<span>Supervised · pseudonymized</span>
							</div>
							<span class="bp-hline demo-grow" style="animation-delay: 0.8s"></span>
							<div class="bp-node demo-pop" style="animation-delay: 0.9s">
								<strong>Company</strong>
								<span>Reviews quotes & meets</span>
							</div>
						</div>
					</div>
				{:else if step.id === 'gemma-pseudonyms'}
					<div class="gemma-box demo-zoom">
						<div class="gemma-chips">
							{#each STRIPPED as field, n (field)}
								<span class="gemma-chip demo-pop" style="animation-delay: {0.08 + n * 0.06}s">
									{field} removed
								</span>
							{/each}
						</div>
						<div class="gemma-cards">
							<div class="gemma-card demo-rise" style="animation-delay: 0.45s">
								<strong>Gemma 4 · Verda, Finland</strong>
								<p>Personal identifiers never reach the scoring panel or employer. Every candidate becomes a pseudonym (e.g. <code>#A-419</code>).</p>
							</div>
							<div class="gemma-card gemma-card--spot demo-rise" style="animation-delay: 0.6s">
								<strong>GDPR Art. 5 & Non-Discrimination Act</strong>
								<p>Name, origin, age, gender, or accent cannot shift a score. Real identity stays locked with the City until mutual consent.</p>
							</div>
						</div>
					</div>
				{:else}
					<div class="browser demo-zoom">
						<div class="browser__bar">
							<span class="browser__dots" aria-hidden="true"><i></i><i></i><i></i></span>
							<span class="browser__url">{step.url}</span>
							<EspooBadge tone="apricot">{step.who}</EspooBadge>
						</div>
						<div class="browser__body">
							{#if step.id === 'ai-panel'}
								<div class="preview-stack">
									<div class="preview-card">
										<span class="preview-kicker">Supervised EXAM terminal · No phone · No web</span>
										<h3>HVAC & Plumbing · Question 2 of 4</h3>
										<p>“Water pools under the sink only when the dishwasher drains. Walk me through what you check first.”</p>
									</div>
									<div class="preview-card preview-spot">
										<span class="preview-kicker">3-Model Panel Consensus</span>
										<div class="memo-list">
											<div><strong>Practicality:</strong> Identified high-loop drain hose & P-trap seal.</div>
											<div><strong>Safety:</strong> Isolated supply before disassembly.</div>
										</div>
									</div>
									<div class="preview-meter">
										<span>Panel readiness</span>
										<EspooBar value={78} tone="apricot" label="Panel readiness" />
									</div>
								</div>
							{:else if step.id === 'people-decide'}
								<div class="preview-stack">
									<div class="preview-card preview-spot">
										<div class="preview-top">
											<div>
												<span class="preview-kicker">Pseudonym: Candidate #A-419 (via Gemma 4)</span>
												<h3>86% skill match · Verified in EXAM room</h3>
											</div>
											<EspooBadge tone="apricot">Invite to 15-min meeting</EspooBadge>
										</div>
										<p>“I isolate the trap and check the dishwasher’s high-loop drain hose before opening any compression fitting…”</p>
									</div>
									<div class="preview-meter">
										<span>Practical know-how (90%)</span>
										<EspooBar value={90} tone="apricot" label="Practical know-how" />
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/key}

	<div class="demo-nav">
		<EspooButton variant="outline" onclick={() => go(index - 1)} disabled={index === 0}>← Back</EspooButton>
		<span class="espoo-muted demo-hint">Use ← / → arrow keys</span>
		<div class="demo-nav__right">
			{#if index < STEPS.length - 1}
				<EspooButton onclick={() => go(index + 1)}>Next →</EspooButton>
			{:else}
				<a class="espoo-arrow-link" href="#/">Try the live EXAM check</a>
				<a class="espoo-arrow-link" href="#review">See sample results</a>
			{/if}
		</div>
	</div>
</section>

<style>
	.demo-wrap {
		padding-block: 2.25rem 3.5rem;
		display: grid;
		gap: 1.5rem;
	}

	.demo-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem 2rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--espoo-border);
	}

	.demo-eyebrow {
		font-family: var(--espoo-font-heading);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--espoo-apricot);
		margin-bottom: 0.35rem;
	}

	.demo-lead {
		max-width: 32rem;
	}

	.demo-progress {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.demo-step-btn {
		background: none;
		border: 0;
		padding: 0;
		text-align: left;
		cursor: pointer;
		color: var(--espoo-text-muted);
	}

	.demo-step-bar {
		display: block;
		height: 0.35rem;
		background-color: var(--espoo-midnight);
		transition: background-color 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.demo-step-btn.done .demo-step-bar {
		background-color: var(--espoo-blue);
	}

	.demo-step-btn.active .demo-step-bar {
		background-color: var(--espoo-apricot);
	}

	.demo-step-num {
		display: none;
		margin-top: 0.45rem;
		font-size: 0.8rem;
		line-height: 1.3;
	}

	@media (min-width: 56em) {
		.demo-step-num {
			display: block;
		}
	}

	.demo-step-btn.active .demo-step-num {
		color: var(--espoo-apricot);
		font-weight: 700;
	}

	.demo-stage {
		display: grid;
		gap: 2rem;
		padding: 2rem;
		background-color: var(--espoo-midnight);
		border: 1px solid var(--espoo-border);
	}

	@media (min-width: 56em) {
		.demo-stage {
			grid-template-columns: 5fr 7fr;
			align-items: center;
			padding: 2.5rem;
		}
	}

	.demo-copy {
		display: grid;
		gap: 0.9rem;
		align-content: start;
	}

	.demo-counter {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--espoo-apricot);
	}

	.demo-text {
		color: var(--espoo-text-muted);
		font-size: 1rem;
		line-height: 1.65;
	}

	.demo-refs {
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.65rem;
	}

	.demo-refs li {
		padding-left: 0.85rem;
		border-left: 2px solid var(--espoo-apricot);
		font-size: 0.86rem;
		color: var(--espoo-text-muted);
		line-height: 1.45;
	}

	.demo-refs strong {
		color: var(--espoo-ink);
	}

	.demo-refs a {
		margin-left: 0.35rem;
		color: var(--espoo-apricot);
		font-weight: 600;
		text-decoration: none;
	}

	.demo-refs a:hover {
		text-decoration: underline;
	}

	.demo-visual {
		display: grid;
		gap: 1rem;
	}

	.minimap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.minimap__line {
		width: 0.85rem;
		height: 1px;
		background-color: var(--espoo-border-strong);
	}

	.minimap__pill {
		padding: 0.25rem 0.65rem;
		font-size: 0.78rem;
		border: 1px solid var(--espoo-border);
		border-radius: 999px;
		color: var(--espoo-text-muted);
		background-color: var(--espoo-white);
		transition: all 0.3s ease;
	}

	.minimap__pill.on {
		border-color: var(--espoo-blue);
		background-color: var(--espoo-blue);
		color: var(--espoo-white);
		font-weight: 700;
	}

	.big-picture,
	.gemma-box {
		display: grid;
		gap: 0.85rem;
		padding: 1.5rem;
		background-color: var(--espoo-white);
		border: 1px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
		box-shadow: 0 4px 14px rgba(11, 27, 51, 0.06);
	}

	.bp-arrows {
		display: grid;
		grid-template-columns: 1fr 1fr;
		justify-items: center;
	}

	.bp-vline {
		width: 2px;
		height: 1.25rem;
		background-color: var(--espoo-apricot);
	}

	.bp-row {
		display: grid;
		grid-template-columns: 1fr 2rem 1.2fr 2rem 1fr;
		align-items: center;
		gap: 0.25rem;
	}

	.bp-hline {
		height: 2px;
		width: 100%;
		background-color: var(--espoo-apricot);
	}

	.bp-node {
		padding: 0.85rem;
		background-color: var(--espoo-midnight);
		border: 1px solid var(--espoo-border-strong);
		display: grid;
		gap: 0.2rem;
	}

	.bp-node--city {
		text-align: center;
		border-color: var(--espoo-apricot);
	}

	.bp-node--accent {
		border-color: var(--espoo-blue);
		background-color: var(--espoo-tint);
	}

	.bp-node strong {
		font-family: var(--espoo-font-heading);
		color: var(--espoo-apricot);
		font-size: 0.95rem;
	}

	.bp-node span {
		font-size: 0.8rem;
		color: var(--espoo-text-muted);
	}

	.gemma-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.gemma-chip {
		padding: 0.25rem 0.65rem;
		font-size: 0.8rem;
		font-weight: 700;
		background-color: var(--espoo-blue);
		color: var(--espoo-white);
		border: 1px solid var(--espoo-apricot);
	}

	.gemma-cards {
		display: grid;
		gap: 0.75rem;
	}

	.gemma-card {
		padding: 1rem 1.15rem;
		background-color: var(--espoo-midnight);
		border: 1px solid var(--espoo-border);
		display: grid;
		gap: 0.35rem;
	}

	.gemma-card--spot {
		border-color: var(--espoo-apricot);
		animation: demo-ring 1.8s cubic-bezier(0.16, 1, 0.3, 1) 2;
	}

	.gemma-card strong {
		color: var(--espoo-apricot);
		font-family: var(--espoo-font-heading);
	}

	.gemma-card p {
		font-size: 0.9rem;
		color: var(--espoo-text-muted);
	}

	.browser {
		background-color: var(--espoo-white);
		border: 1px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
		box-shadow: 0 8px 24px rgba(11, 27, 51, 0.08);
		overflow: hidden;
	}

	.browser__bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 1rem;
		background-color: var(--espoo-midnight);
		border-bottom: 1px solid var(--espoo-border);
	}

	.browser__dots {
		display: flex;
		gap: 0.35rem;
	}

	.browser__dots i {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background-color: var(--espoo-border-strong);
	}

	.browser__url {
		flex: 1;
		font-size: 0.8rem;
		color: var(--espoo-text-muted);
		font-family: monospace;
	}

	.browser__body {
		padding: 1.5rem;
		zoom: 0.9;
	}

	.preview-stack {
		display: grid;
		gap: 1rem;
	}

	.preview-card {
		padding: 1.15rem;
		background-color: var(--espoo-midnight);
		border: 1px solid var(--espoo-border);
		display: grid;
		gap: 0.45rem;
	}

	.preview-spot {
		border-color: var(--espoo-apricot);
		animation: demo-ring 1.8s cubic-bezier(0.16, 1, 0.3, 1) 2;
	}

	.preview-kicker {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--espoo-apricot);
		font-weight: 700;
	}

	.preview-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.memo-list {
		display: grid;
		gap: 0.45rem;
		font-size: 0.9rem;
		color: var(--espoo-text-muted);
	}

	.memo-list strong {
		color: var(--espoo-ink);
	}

	.preview-meter {
		display: grid;
		gap: 0.4rem;
		font-size: 0.85rem;
	}

	.demo-nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.demo-hint {
		font-size: 0.85rem;
	}

	.demo-nav__right {
		margin-left: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.5rem;
	}

	@keyframes demo-rise {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: none; }
	}
	@keyframes demo-zoom {
		from { opacity: 0; transform: scale(0.93); }
		to { opacity: 1; transform: none; }
	}
	@keyframes demo-pop {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}
	@keyframes demo-grow {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}
	@keyframes demo-grow-y {
		from { transform: scaleY(0); }
		to { transform: scaleY(1); }
	}
	@keyframes demo-ring {
		0% { box-shadow: 0 0 0 0 rgba(255, 195, 134, 0.45); }
		100% { box-shadow: 0 0 0 14px rgba(255, 195, 134, 0); }
	}

	.demo-rise {
		animation: demo-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.demo-zoom {
		animation: demo-zoom 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.demo-pop {
		animation: demo-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.demo-grow {
		animation: demo-grow 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
		transform-origin: left;
	}
	.demo-grow-y {
		animation: demo-grow-y 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
		transform-origin: top;
	}
</style>
