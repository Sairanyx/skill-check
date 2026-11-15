<script>
	import { onMount } from 'svelte';
	import { PANELIST_FOCUS } from './samples.js';

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
			title: 'Three Gemini 4 models listen',
			text: 'They ask about the task and agree on each next question. Name, accent and grammar never count.',
			source: { text: 'Structured interviews about the job predict performance best.', name: 'Sackett et al. 2022', href: 'https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance' }
		},
		{
			title: 'People decide',
			text: "The company sees a result backed by the candidate's own words, and chooses whom to meet for 15 minutes.",
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
							{#each ['No CV, no cover letter', 'No phone, nobody else', 'A real task from the company'] as item, n (item)}
								<li class="pop" style={delay(0.8 + n * 0.35)}><span>✓</span>{item}</li>
							{/each}
						</ul>
					{:else if index === 2}
						<div class="panel">
							{#each PANEL as name, n (name)}
								<div class="card pop" class:ring={n === 0} style={delay(0.2 + n * 0.35)}>
									<span class="eyebrow">{PANELIST_FOCUS[name]}</span>
									<strong>Gemini 4 {name}</strong>
								</div>
							{/each}
						</div>
						<span class="line-x grow-x" style={delay(1.4)}></span>
						<div class="card card--question rise" style={delay(1.7)}>
							<span class="eyebrow">Next question, agreed by all three</span>
							<strong>“Walk me through how you would find the cause.”</strong>
						</div>
					{:else}
						<div class="card card--result pop" style={delay(0.1)}>
							<span class="eyebrow">Candidate 31F1 · Data analyst</span>
							<span class="score pop" style={delay(0.6)}>8.8<small>/10</small></span>
							<span class="badge pop ring" style={delay(1)}>Meet this candidate</span>
							<p class="quote rise" style={delay(1.4)}>“isolate the incomplete journeys instead of guessing timestamps”</p>
						</div>
						<div class="card card--meet rise" style={delay(1.9)}>
							<strong>15-minute meeting at the event</strong>
							<span>The company decides. The AI never does.</span>
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
		min-height: calc(100vh - 4.75rem); /* fills the screen under the header */
		background-color: var(--espoo-deep);
		color: var(--espoo-on-blue);
		padding-block: 2.5rem 3rem;
	}

	.progress {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.4rem;
	}

	.progress button {
		height: 0.3rem;
		padding: 0;
		border: 0;
		border-radius: 1rem;
		background-color: rgba(255, 255, 255, 0.2);
		cursor: pointer;
		transition: background-color 0.4s ease;
	}

	.progress button.on {
		background-color: var(--espoo-glow);
	}

	.slide {
		display: grid;
		gap: 2.5rem;
		align-items: center;
		min-height: 26rem;
		padding-block: 2.5rem;
	}

	@media (min-width: 58em) {
		.slide {
			grid-template-columns: 5fr 6fr;
			gap: 4rem;
		}
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
		font-size: clamp(2rem, 4vw, 2.75rem);
	}

	.lead {
		margin-top: 1rem;
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.88);
	}

	.source {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.72);
	}

	.source a {
		color: var(--espoo-glow);
		font-weight: 600;
	}

	/* The picture side: white cards on the Finnish blue, as on espoo.fi */
	.visual {
		display: grid;
		gap: 0.9rem;
		padding: 1.75rem;
		background-color: var(--espoo-blue);
		border-radius: var(--espoo-radius);
	}

	.card {
		display: grid;
		gap: 0.2rem;
		padding: 1rem 1.2rem;
		background-color: #ffffff;
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

	.eyebrow {
		font-size: 0.8rem !important;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.pair,
	.links {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}

	.links {
		margin-block: -0.5rem;
	}

	.line-y {
		justify-self: center;
		width: 2px;
		height: 1.5rem;
		background-color: var(--espoo-glow);
	}

	.line-x {
		justify-self: center;
		width: 2px;
		height: 1.25rem;
		background-color: var(--espoo-glow);
	}

	.caption {
		text-align: center;
		font-weight: 600;
		color: var(--espoo-glow);
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
		background-color: rgba(255, 255, 255, 0.12);
		border-radius: var(--espoo-radius);
		font-weight: 600;
	}

	.checks li span {
		display: inline-grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background-color: var(--espoo-glow);
		color: var(--espoo-deep);
		font-size: 0.85rem;
	}

	.panel {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	.panel .card strong {
		font-size: 1rem;
	}

	.card .score {
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: 3rem;
		line-height: 1.1;
		color: var(--espoo-apricot) !important;
	}

	.card .score small {
		font-size: 1.1rem;
	}

	.badge {
		justify-self: start;
		padding: 0.25rem 0.7rem;
		border-radius: 1rem;
		background-color: var(--espoo-glow);
		color: var(--espoo-deep) !important;
		font-weight: 700;
		font-size: 0.85rem !important;
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
		color: rgba(255, 255, 255, 0.6);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.7rem 1.4rem;
		border: 2px solid var(--espoo-glow);
		border-radius: var(--espoo-radius);
		background-color: var(--espoo-glow);
		color: var(--espoo-deep);
		font: inherit;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.btn:hover:not(:disabled) {
		background-color: transparent;
		color: var(--espoo-glow);
	}

	.btn--ghost {
		background-color: transparent;
		border-color: rgba(255, 255, 255, 0.5);
		color: var(--espoo-on-blue);
	}

	.btn--ghost:hover:not(:disabled) {
		border-color: var(--espoo-glow);
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
		0% { box-shadow: 0 0 0 0 rgba(255, 195, 134, 0.7); }
		100% { box-shadow: 0 0 0 14px rgba(255, 195, 134, 0); }
	}

	.rise { animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
	.zoom { animation: zoom 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
	.pop { animation: pop 0.5s ease-out both; }
	.pop.ring { animation: pop 0.5s ease-out both, ring 1.4s ease-out 0.6s 3; }
	.grow-y, .grow-x { animation: grow-y 0.5s ease-out both; transform-origin: top; }

	@media (prefers-reduced-motion: reduce) {
		.rise, .zoom, .pop, .pop.ring, .grow-y, .grow-x { animation: none; }
	}
</style>
