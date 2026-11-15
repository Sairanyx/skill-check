<script>
	import { onMount } from 'svelte';
	import { PANELIST_FOCUS } from './samples.js';
	import Redacted from './Redacted.svelte';

	/**
	 * How it works, in four short slides with motion that leads the eye.
	 * Facts and sources come from docs/RESEARCH.md on the dev branch.
	 */
	const SLIDES = [
		{
			title: 'The City of Espoo organises recruitment events',
			text: 'About 30,000 jobseekers. Companies join and say what they need.',
			source: { text: 'Since 2025 the City is the employment authority for Espoo and Kauniainen.', name: 'Työmarkkinatori', href: 'https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle' }
		},
		{
			title: 'Jobseekers go to an EXAM room',
			text: '30 minutes on a supervised City computer. No CV, no phone, just a real task.',
			source: { text: '29 Finnish universities already use booked, supervised EXAM rooms.', name: 'Aalto University', href: 'https://www.aalto.fi/en/services/electronic-examinations-exam-service' }
		},
		{
			title: 'Personal details removed, then the panel listens',
			text: 'Gemma 4 on our server in Finland removes name, age, employer, place and origin. The three Gemini 4 models only see the skill, so bias has nothing to work with.',
			source: { text: 'Language models rank identical CVs differently by name.', name: 'CUHK audit of 14 LLMs, 2026', href: 'https://arxiv.org/pdf/2606.28978' }
		},
		{
			title: 'People decide',
			text: 'The company sees the result under an alias, never a name, and invites the candidate to sit down at the event. An accepted check becomes a SkillCheck badge.',
			source: { text: 'Recruitment AI is high-risk under the EU AI Act: people must stay in control.', name: 'DLA Piper', href: 'https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act' }
		}
	];
	const PANEL = ['Hydrogen', 'Argon', 'Carbon'];

	let index = $state(0);
	let jobseekers = $state(0);
	const slide = $derived(SLIDES[index]);
	const last = SLIDES.length - 1;
	const go = (n) => (index = Math.max(0, Math.min(last, n)));
	const delay = (s) => `animation-delay: ${s}s`;

	// Slide 1 counts up to 30,000 (instantly for people who prefer less motion).
	$effect(() => {
		if (index !== 0) return;
		const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1300;
		const start = performance.now();
		let raf = 0;
		const tick = (t) => {
			const p = ms ? Math.min(1, (t - start) / ms) : 1;
			jobseekers = Math.round(30000 * (1 - Math.pow(1 - p, 3)));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	onMount(() => {
		const key = (e) => {
			if (e.target.closest?.('input, textarea, select')) return;
			if (e.key === 'ArrowRight') go(index + 1);
			if (e.key === 'ArrowLeft') go(index - 1);
		};
		addEventListener('keydown', key);
		return () => removeEventListener('keydown', key);
	});
</script>

<section class="intro" aria-roledescription="carousel" aria-label="How SkillCheck works">
	<div class="espoo-container">
		<div class="progress" role="tablist">
			{#each SLIDES as s, n (s.title)}
				<button
					role="tab"
					aria-selected={n === index}
					aria-label="Slide {n + 1}: {s.title}"
					class:on={n <= index}
					onclick={() => go(n)}
				></button>
			{/each}
		</div>

		{#key index}
			<div class="slide">
				<div class="text rise">
					<span class="number">{index + 1}</span>
					<h1>{slide.title}</h1>
					<p class="lead">{slide.text}</p>
					<p class="source rise" style={delay(0.6)}>
						{slide.source.text}
						<a href={slide.source.href} target="_blank" rel="noreferrer">{slide.source.name} ↗</a>
					</p>
				</div>

				<div class="visual zoom" aria-hidden="true">
					{#if index === 0}
						<div class="card card--city pop ring" style={delay(0.1)}>
							<strong>City of Espoo</strong>
							<span><b>{jobseekers.toLocaleString('en-US')}</b> jobseekers</span>
						</div>
						<div class="links">
							<span class="line-y grow-y" style={delay(0.7)}></span>
							<span class="line-y grow-y" style={delay(0.7)}></span>
						</div>
						<div class="pair">
							<div class="card pop" style={delay(1)}><strong>Jobseekers</strong><span>pick companies</span></div>
							<div class="card pop" style={delay(1.2)}><strong>Companies</strong><span>say what they need</span></div>
						</div>
						<p class="caption rise" style={delay(1.7)}>One recruitment event, both sides</p>
					{:else if index === 1}
						<div class="card card--room pop ring" style={delay(0.1)}>
							<span class="eyebrow">EXAM room · Leppävaara</span>
							<strong>Fri 27 Nov, 13:00 to 13:30</strong>
						</div>
						<ul class="checks">
							{#each ['No CV, no cover letter', 'No phone, nobody else', 'Your name stays with the City', 'A real task from the company'] as item, n (item)}
								<li class="pop" style={delay(0.8 + n * 0.35)}><span>✓</span>{item}</li>
							{/each}
						</ul>
					{:else if index === 2}
						<div class="card rise" style={delay(0.1)}>
							<span class="eyebrow">What Aino said</span>
							<p class="said">My name is Aino Mäkelä, I am 52 and I worked at Skanska in Vantaa until 2019. First I check the level with a laser.</p>
						</div>
						<div class="filter rise" style={delay(0.8)}>
							<span class="filter__line grow-y"></span>
							<span class="filter__label">Privacy guard · Gemma 4 on our server in Finland</span>
						</div>
						<div class="card card--seen rise ring" style={delay(1.2)}>
							<span class="eyebrow">What the AI reads</span>
							<p class="said">
								<Redacted text="My name is [NAME], I am [PERSONAL] and I worked at [EMPLOYER] in [PLACE] until [YEAR]. First I check the level with a laser." from={1.6} />
							</p>
						</div>
						<div class="panel">
							{#each PANEL as name, n (name)}
								<div class="card card--model pop" style={delay(3.4 + n * 0.25)}>
									<strong>Gemini 4 {name}</strong>
									<span class="eyebrow">{PANELIST_FOCUS[name]}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="card card--result pop" style={delay(0.1)}>
							<span class="eyebrow">Candidate 31F1 · Data analyst · no name, no photo</span>
							<span class="score pop" style={delay(0.6)}>8.8<small>/10</small></span>
							<span class="badge pop" style={delay(1)}>Meet this candidate</span>
							<p class="quote rise" style={delay(1.4)}>“isolate the incomplete journeys instead of guessing timestamps”</p>
						</div>
						<div class="pair">
							<div class="card rise" style={delay(1.9)}>
								<strong>Sit-down at the event</strong>
								<span>The company decides. The AI never does.</span>
							</div>
							<div class="card card--badge pop ring" style={delay(2.4)}>
								<span class="medal">✓</span>
								<strong>SkillCheck badge</strong>
								<span>On the event card, with consent</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/key}

		<div class="nav">
			<button class="btn btn--ghost" onclick={() => go(index - 1)} disabled={index === 0}>Back</button>
			<span class="hint">or use the arrow keys</span>
			{#if index < last}
				<button class="btn" onclick={() => go(index + 1)}>Next</button>
			{:else}
				<a class="btn" href="#exam-room">Go to the EXAM room</a>
				<a class="btn btn--ghost" href="#review">See a finished result</a>
			{/if}
		</div>
	</div>
</section>

<style>
	.intro {
		min-height: calc(100vh - 4.75rem);
		padding-block: 2rem 3rem;
	}

	.progress {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.4rem;
	}

	.progress button {
		height: 0.35rem;
		padding: 0;
		border: 0;
		border-radius: 1rem;
		background-color: var(--espoo-tint);
		cursor: pointer;
		transition: background-color 0.4s ease;
	}

	.progress button.on {
		background-color: var(--espoo-blue);
	}

	/* Two panels side by side, always the same height, so the boxes line up from slide to slide */
	.slide {
		display: grid;
		gap: 1.25rem;
		align-items: stretch;
		padding-block: 1.5rem;
	}

	@media (min-width: 58em) {
		.slide {
			grid-template-columns: 5fr 6fr;
			min-height: 30rem;
		}
	}

	.text {
		display: flex;
		flex-direction: column;
		padding: 2.25rem;
		border-radius: var(--espoo-radius-lg);
		background-color: var(--espoo-deep);
		color: var(--espoo-on-blue);
	}

	.number {
		display: inline-grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 2px solid var(--espoo-glow);
		border-radius: 50%;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.15rem;
		color: var(--espoo-glow);
	}

	h1 {
		margin-top: 1.25rem;
		font-size: clamp(1.9rem, 3.4vw, 2.5rem);
	}

	.lead {
		margin-top: 1rem;
		font-size: 1.15rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.source {
		margin-top: auto;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.25);
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.78);
	}

	.source a {
		color: var(--espoo-glow);
		font-weight: 600;
	}

	/* The picture: white cards on a light grey panel, like the demo on skillcheck.fi */
	.visual {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.85rem;
		padding: 2rem;
		background-color: var(--espoo-mist);
		border-radius: var(--espoo-radius-lg);
	}

	.card {
		display: grid;
		gap: 0.25rem;
		padding: 1rem 1.2rem;
		background-color: #ffffff;
		border: 2px solid var(--espoo-border);
		color: #0b1b33;
		border-radius: var(--espoo-radius);
	}

	.card strong {
		font-family: var(--espoo-font-heading);
		font-size: 1.15rem;
		color: var(--espoo-apricot);
	}

	.card span {
		color: #5b6577;
		font-size: 0.95rem;
	}

	.card b {
		color: #0b1b33;
	}

	.card--city,
	.card--room,
	.card--seen {
		background-color: var(--espoo-tint);
	}

	.eyebrow {
		font-size: 0.78rem !important;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.said {
		font-size: 1rem;
		line-height: 1.7;
	}

	.filter {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-left: 1.2rem;
	}

	.filter__line {
		width: 2px;
		height: 1.6rem;
		background-color: var(--espoo-blue);
	}

	.filter__label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--espoo-blue);
	}

	.pair,
	.links {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}

	.links {
		margin-block: -0.45rem;
	}

	.line-y,
	.line-x {
		justify-self: center;
		width: 2px;
		height: 1.5rem;
		background-color: var(--espoo-blue);
	}

	.caption {
		text-align: center;
		font-weight: 600;
		color: var(--espoo-blue);
	}

	.checks {
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.checks li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.8rem 1rem;
		background-color: #ffffff;
		border: 2px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
		font-weight: 600;
	}

	.checks li span {
		display: inline-grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue);
		font-size: 0.85rem;
	}

	.panel {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	.card--model strong {
		font-size: 0.98rem;
	}

	.card .score {
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: 3rem;
		line-height: 1.1;
		color: var(--espoo-apricot);
	}

	.card .score small {
		font-size: 1.1rem;
	}

	.badge {
		justify-self: start;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue) !important;
		font-weight: 700;
		font-size: 0.85rem !important;
	}

	.card--badge {
		background-color: var(--espoo-tint);
	}

	.medal {
		display: inline-grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue) !important;
		font-weight: 700;
	}

	.quote {
		margin-top: 0.5rem;
		padding-left: 0.75rem;
		border-left: 3px solid var(--espoo-apricot);
		font-style: italic;
		color: #0b1b33;
	}

	.nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.hint {
		margin-right: auto;
		font-size: 0.85rem;
		color: var(--espoo-text-muted);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.7rem 1.4rem;
		border: 2px solid var(--espoo-blue);
		border-radius: var(--espoo-radius);
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue);
		font: inherit;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.btn:hover:not(:disabled) {
		background-color: #00245a;
		border-color: #00245a;
	}

	.btn--ghost {
		background-color: transparent;
		color: var(--espoo-blue);
	}

	.btn--ghost:hover:not(:disabled) {
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue);
	}

	.btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* Motion that leads the eye. Off for people who prefer less motion. */
	@keyframes rise {
		from { opacity: 0; transform: translateY(14px); }
		to { opacity: 1; transform: none; }
	}
	@keyframes zoom {
		from { opacity: 0; transform: scale(0.85); }
		to { opacity: 1; transform: none; }
	}
	@keyframes pop {
		0% { opacity: 0; transform: scale(0.6); }
		70% { opacity: 1; transform: scale(1.06); }
		100% { opacity: 1; transform: scale(1); }
	}
	@keyframes grow-y {
		from { transform: scaleY(0); }
		to { transform: scaleY(1); }
	}
	@keyframes ring {
		0% { box-shadow: 0 0 0 0 rgba(0, 53, 128, 0.35); }
		100% { box-shadow: 0 0 0 14px rgba(0, 53, 128, 0); }
	}

	.rise { animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
	.zoom { animation: zoom 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
	.pop { animation: pop 0.5s ease-out both; }
	.pop.ring { animation: pop 0.5s ease-out both, ring 1.4s ease-out 0.6s 3; }
	.rise.ring { animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both, ring 1.4s ease-out 1.2s 3; }
	.grow-y, .grow-x { animation: grow-y 0.5s ease-out both; transform-origin: top; }

	@media (prefers-reduced-motion: reduce) {
		.rise, .zoom, .pop, .pop.ring, .grow-y, .grow-x { animation: none; }
	}
</style>
