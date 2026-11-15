<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { PANELIST_FOCUS } from './samples.js';
	import Redacted from './Redacted.svelte';

	/**
	 * How it works, in four short slides with motion that leads the eye.
	 * Facts and sources come from docs/RESEARCH.md on the dev branch.
	 */
	// The story follows the Espoo challenge: problem, our answer, fair by design, the result.
	const SLIDES = [
		{
			title: 'The problem, and where SkillCheck fits',
			text: 'City of Espoo events bring hundreds of jobseekers and dozens of companies together. CVs are now often written by AI, so companies cannot see who can do the job. SkillCheck adds a short, supervised skill check in between.',
			source: { text: 'Espoo TalentMatch events bring 200 to 1,000 jobseekers and 5 to 50 employers together.', name: 'City of Espoo', href: 'https://www.espoo.fi/en/talentmatch-events' }
		},
		{
			title: 'Our answer: a skill check in rooms the City already has',
			text: 'Instead of a CV, jobseekers talk through a real task on a supervised computer. It runs in City spaces that already host recruitment events, so no new buildings are needed.',
			source: { text: '29 Finnish universities already run exams this way, in supervised EXAM rooms.', name: 'Aalto University', href: 'https://www.aalto.fi/en/services/electronic-examinations-exam-service' }
		},
		{
			title: 'Fair by design',
			text: 'Gemma 4 removes personal details on our server in Finland. Three Gemini 4 models then judge only the skill, never the name, age or origin.',
			source: { text: 'Language models rank identical CVs differently by name.', name: 'CUHK audit of 14 LLMs, 2026', href: 'https://arxiv.org/pdf/2606.28978' }
		},
		{
			title: 'The result: better matches at the event',
			text: 'Companies get evidence under aliases and invite people to sit down at the event. People decide. An accepted check becomes a SkillCheck badge.',
			source: { text: 'Recruitment AI is high-risk under the EU AI Act, so people stay in control.', name: 'DLA Piper', href: 'https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act' }
		}
	];
	const PANEL = ['Hydrogen', 'Argon', 'Carbon'];

	let index = $state(0);
	let jobseekers = $state(0);
	const slide = $derived(SLIDES[index]);
	const last = SLIDES.length - 1;
	let dir = $state(1);
	const go = (n) => {
		const next = Math.max(0, Math.min(last, n));
		if (next === index) return;
		dir = next > index ? 1 : -1;
		index = next;
	};
	const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
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

{#snippet icon(name)}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if name === 'city'}<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3z" />
		{:else if name === 'person'}<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
		{:else if name === 'company'}<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h4M10 18h4" />
		{:else}<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2zM18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />{/if}
	</svg>
{/snippet}

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
			<div class="slide" in:fly={{ x: reduced ? 0 : 40 * dir, duration: reduced ? 0 : 450, easing: cubicOut }}>
				<div class="text rise">
					<div class="slide__head">
						<span class="number">{index + 1}</span>
					</div>
					<h1>{slide.title}</h1>
					<p class="lead">{slide.text}</p>
					<p class="source rise" style={delay(0.6)}>
						{slide.source.text}
						<a href={slide.source.href} target="_blank" rel="noreferrer">{slide.source.name} ↗</a>
					</p>
				</div>

				<div class="visual zoom" aria-hidden="true">
					{#if index === 0}
						<div class="node node--city rise ring" style={delay(0.1)}>
							<span class="node__title">{@render icon('city')} City of Espoo</span>
							<span class="node__text">Runs the event and the EXAM rooms. Responsible for <b>{jobseekers.toLocaleString('en-US')}</b> jobseekers.</span>
						</div>
						<div class="map map--links">
							<span class="line-y grow-y" style={delay(0.6)}></span><span></span><span></span><span></span><span class="line-y grow-y" style={delay(0.6)}></span>
						</div>
						<div class="map">
							<div class="node rise" style={delay(0.9)}>
								<span class="node__title">{@render icon('person')} Jobseeker</span>
								<span class="node__text">Picks companies, takes one check</span>
							</div>
							<div class="arrow"><span class="arrow__label rise" style={delay(1.6)}>books 30 min</span><span class="arrow__line grow-x" style={delay(1.4)}></span></div>
							<div class="node node--exam rise" style={delay(1.2)}>
								<span class="node__title">{@render icon('chat')} EXAM room + AI</span>
								<span class="node__text">Personal details removed, then a Gemini 4 panel interview</span>
							</div>
							<div class="arrow"><span class="arrow__label rise" style={delay(1.8)}>one real task</span><span class="arrow__line arrow__line--left grow-x" style={delay(1.6)}></span></div>
							<div class="node rise" style={delay(1)}>
								<span class="node__title">{@render icon('company')} Company</span>
								<span class="node__text">Says what it needs, sees evidence</span>
							</div>
						</div>
						<p class="caption rise" style={delay(2.2)}>Accepted checks become a sit-down at the event</p>
					{:else if index === 1}
						<div class="node node--exam node--big rise ring" style={delay(0.1)}>
							<span class="node__title">{@render icon('chat')} EXAM room</span>
							<span class="node__text">A supervised computer in a space the City already uses</span>
						</div>
						<ul class="places">
							{#each [
								{ name: 'Sello library', what: 'Already hosts City employer meet-ups' },
								{ name: 'Lippulaiva library', what: 'Already hosts City employer meet-ups' },
								{ name: 'Espoo Talent Hub, Otaniemi', what: 'Already runs employer speed dating' }
							] as place, n (place.name)}
								<li class="rise" style={delay(0.7 + n * 0.3)}>
									<span class="places__pin">{@render icon('city')}</span>
									<span><strong>{place.name}</strong><span>{place.what}</span></span>
								</li>
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
			{#if index > 0}<button class="btn btn--ghost" onclick={() => go(index - 1)}>Back</button>{/if}
			{#if index < last}
				<button class="btn" onclick={() => go(index + 1)}>Next</button>
			{:else}
				<a class="btn" href="#exam-room">Try the EXAM room</a>
				<a class="btn btn--ghost" href="#review">See a finished result</a>
				<a class="btn btn--ghost" href="#platform">Explore the platform</a>
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
			min-height: 34rem; /* every slide the same height, so the buttons never move */
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

	.slide__head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
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
		font-size: var(--text-lg);
		color: var(--espoo-glow);
	}

	h1 {
		margin-top: 1.25rem;
		font-size: var(--text-3xl);
	}

	.lead {
		margin-top: 1rem;
		font-size: var(--text-base);
		color: rgba(255, 255, 255, 0.9);
	}

	.source {
		margin-top: auto;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.25);
		font-size: var(--text-sm);
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
		align-content: start; /* title and text stay together when boxes share a row */
		gap: 0.25rem;
		padding: 1rem 1.2rem;
		background-color: #ffffff;
		border: 2px solid var(--espoo-border);
		color: #0b1b33;
		border-radius: var(--espoo-radius);
	}

	.card strong {
		font-family: var(--espoo-font-heading);
		font-size: var(--text-base);
		color: var(--espoo-apricot);
	}

	.card span {
		color: #5b6577;
		font-size: var(--text-sm);
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
		font-size: var(--text-xs) !important;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.said {
		font-size: var(--text-base);
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
		font-size: var(--text-sm);
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

	.node {
		display: grid;
		align-content: start;
		gap: 0.3rem;
		padding: 0.9rem 1rem;
		background-color: #ffffff;
		border: 2px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
	}

	.map .node,
	.node--city,
	.node--big {
		justify-items: center;
		text-align: center;
	}

	.node--big {
		padding: 1.25rem 1.4rem;
	}

	.node--city {
		border-color: var(--espoo-blue);
	}

	.node--exam {
		border-color: var(--espoo-blue);
		background-color: #f5f8fd;
	}

	.node__title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: var(--text-base);
		color: var(--espoo-blue);
	}

	.node__title svg {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
	}

	.node__text {
		font-size: var(--text-sm);
		color: #5b6577;
	}

	.node__text b {
		color: #0b1b33;
	}

	.map {
		display: grid;
		grid-template-columns: 1fr 3.5rem 1.2fr 3.5rem 1fr;
		align-items: stretch;
	}

	.map--links {
		margin-block: -0.35rem;
	}

	.map--links .line-y {
		justify-self: center;
	}

	.arrow {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding-inline: 0.25rem;
		text-align: center;
	}

	.arrow__label {
		font-size: var(--text-xs);
		line-height: 1.2;
		color: var(--espoo-text-muted);
	}

	.arrow__line {
		display: block;
		width: 100%;
		height: 2px;
		background-color: var(--espoo-blue);
	}

	.arrow__line--left.grow-x {
		transform-origin: right;
	}

	.caption {
		text-align: center;
		font-weight: 600;
		color: var(--espoo-blue);
	}

	.places {
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.places li {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.7rem 1rem;
		background-color: #ffffff;
		border: 2px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
	}

	.places li > span:last-child {
		display: grid;
		gap: 0.1rem;
	}

	.places strong {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: var(--text-base);
		color: var(--espoo-blue);
	}

	.places li > span:last-child > span {
		font-size: var(--text-sm);
		color: #5b6577;
	}

	.places__pin {
		display: inline-grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border-radius: 50%;
		background-color: var(--espoo-tint);
		color: var(--espoo-blue);
	}

	.places__pin svg {
		width: 1rem;
		height: 1rem;
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
		font-size: var(--text-sm);
	}

	.panel {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	.card .score {
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: var(--text-display);
		line-height: 1.1;
		color: var(--espoo-apricot);
	}

	.card .score small {
		font-size: var(--text-lg);
	}

	.badge {
		justify-self: start;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue) !important;
		font-weight: 700;
		font-size: var(--text-sm) !important;
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

	.nav .btn:first-child {
		margin-right: auto;
	}

	.nav .btn:only-child {
		margin-left: auto;
		margin-right: 0;
	}

	.hint {
		margin-right: auto;
		font-size: var(--text-sm);
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

	/* One motion family: things fade up a little, in reading order. One soft highlight on the key box.
	   Off for people who prefer less motion. */
	@keyframes rise {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: none; }
	}
	@keyframes zoom {
		from { opacity: 0; transform: translateY(8px) scale(0.99); }
		to { opacity: 1; transform: none; }
	}
	@keyframes grow-y {
		from { transform: scaleY(0); }
		to { transform: scaleY(1); }
	}
	@keyframes grow-x {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}
	@keyframes glow {
		0%, 100% { box-shadow: 0 0 0 0 rgba(0, 53, 128, 0); }
		50% { box-shadow: 0 0 0 6px rgba(0, 53, 128, 0.12); }
	}

	.rise, .pop { animation: rise 0.55s cubic-bezier(0.25, 0.8, 0.25, 1) both; }
	.zoom { animation: zoom 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) both; }
	.pop.ring, .rise.ring { animation: rise 0.55s cubic-bezier(0.25, 0.8, 0.25, 1) both, glow 1.6s ease-in-out 0.8s 1; }
	.grow-y { animation: grow-y 0.45s ease-out both; transform-origin: top; }
	.grow-x { animation: grow-x 0.45s ease-out both; transform-origin: left; }

	@media (prefers-reduced-motion: reduce) {
		.rise, .zoom, .pop, .pop.ring, .rise.ring, .grow-y, .grow-x { animation: none; }
	}
</style>
