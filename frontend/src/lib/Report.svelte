<script>
	import {
		EspooAccordion,
		EspooAlert,
		EspooBadge,
		EspooBar,
		EspooButton,
		EspooCard,
		EspooSpinner
	} from './espoo/index.js';
	import RoundNotes from './RoundNotes.svelte';
	import Transcript from './Transcript.svelte';
	import { LANGUAGES, SPLIT_PANEL, count, formatDate, scoreTone, verdictLabel } from './format.js';
	import { PANELIST_FOCUS } from './samples.js';

	/** Everything GET /api/review/{id} returns, plus the role it was for. */
	let { interview, role, onretry } = $props();

	const report = $derived(interview.report);
	const language = $derived(LANGUAGES.find((l) => l.value === interview.language)?.label);
	let retrying = $state(false);

	async function retry() {
		retrying = true;
		await onretry();
		retrying = false;
	}
</script>

{#snippet bulletList(items)}
	<ul>
		{#each items as item (item)}<li>{item}</li>{/each}
	</ul>
{/snippet}

<article class="report">
	<header class="report__head">
		<div>
			<span class="espoo-muted">{role.company}</span>
			<h2>{role.title}</h2>
			<p class="espoo-muted report__meta">
				{formatDate(interview.created_at)} · {language} · ID {interview.id}
				{#if interview.ended_by_candidate}· Ended early by the candidate{/if}
			</p>
		</div>
		{#if report}
			<div class="score">
				<span class="score__number">{report.how_good_or_bad}<small>/10</small></span>
				<EspooBadge tone={report.is_person_good ? 'apricot' : 'alert'}>
					{verdictLabel(report.is_person_good)}
				</EspooBadge>
			</div>
		{/if}
	</header>

	{#if report}
		<!-- 1. The decision: summary and the three verdicts behind the score -->
		<p class="report__summary">{report.summary}</p>

		{#if report.disagreement >= SPLIT_PANEL}
			<EspooAlert variant="note" title="The panel disagreed by {report.disagreement} points">
				Read the three verdicts below before deciding.
			</EspooAlert>
		{/if}

		<section class="block">
			<h3 class="block__title"><span>1</span> Panel verdicts</h3>
			<div class="grid grid--3">
				{#each report.panel as verdict (verdict.panelist)}
					<EspooCard
						eyebrow="Gemini 4 · {PANELIST_FOCUS[verdict.panelist]}"
						title="{verdict.panelist}: {verdict.how_good_or_bad}/10 · {verdictLabel(verdict.is_person_good)}"
					>
						<p class="clamp">{verdict.reasoning}</p>
					</EspooCard>
				{/each}
			</div>
		</section>

		<!-- 2. The evidence: each skill with the candidate's own words -->
		<section class="block">
			<h3 class="block__title"><span>2</span> Skills, with the candidate's own words</h3>
			<ul class="skills">
				{#each report.skills as skill (skill.skill)}
					{@const tone = scoreTone(skill.score)}
					<li class="skill">
						<div class="skill__head">
							<strong>{skill.skill}</strong>
							<EspooBadge {tone}>{skill.score}/10</EspooBadge>
						</div>
						<EspooBar value={skill.score * 10} {tone} />
						<p>{skill.reason}</p>
						{#each skill.quotes as quote (quote)}
							<blockquote>“{quote}”</blockquote>
						{:else}
							<p class="espoo-muted">No quote from the skill check supports this skill.</p>
						{/each}
					</li>
				{/each}
			</ul>
		</section>

		<!-- 3. Ready for the meeting: what is strong, what to check, what to ask -->
		<section class="block">
			<h3 class="block__title"><span>3</span> For the 15-minute meeting</h3>
			<div class="grid grid--2">
				<EspooCard title="Strengths">{@render bulletList(report.strengths)}</EspooCard>
				<EspooCard title="Check in person">{@render bulletList(report.gaps)}</EspooCard>
			</div>
			<EspooCard title="What to talk about"><p>{report.suggested_conversation}</p></EspooCard>
		</section>

		<!-- Details, folded away -->
		<EspooAccordion title="Feedback sent to the candidate (without the score)">
			<p>{report.candidate_feedback}</p>
		</EspooAccordion>
		<EspooAccordion title="How they asked questions">
			<p>{report.inquiry}</p>
		</EspooAccordion>
	{:else if interview.status === 'reporting'}
		<EspooSpinner>The panel is writing the report. This page updates by itself in 1 to 2 minutes.</EspooSpinner>
	{:else if interview.status === 'failed'}
		<EspooAlert variant="alert" title="The report couldn't be written">
			Nothing is lost: the panel can try again from the same interview.
		</EspooAlert>
		<div>
			<EspooButton onclick={retry} disabled={retrying}>{retrying ? 'Retrying…' : 'Try again'}</EspooButton>
		</div>
	{:else}
		<p>This skill check is still going. The result appears here when it ends.</p>
	{/if}

	<EspooAccordion title="Transcript ({count(interview.transcript.length, 'turn')})">
		<Transcript turns={interview.transcript} showKinds />
	</EspooAccordion>

	{#if interview.rounds.length}
		<EspooAccordion title="Panel deliberation ({count(interview.rounds.length, 'round')})">
			<ol class="rounds">
				{#each interview.rounds as round, i (i)}
					<li>
						<h4>Round {i + 1}</h4>
						<RoundNotes {round} />
					</li>
				{/each}
			</ol>
		</EspooAccordion>
	{/if}
</article>

<style>
	.report {
		display: grid;
		gap: 1.75rem;
	}

	.report__head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1.25rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--espoo-border);
	}

	.report__meta {
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.score {
		display: grid;
		justify-items: end;
		align-content: start;
		gap: 0.35rem;
	}

	.score__number {
		font-family: var(--espoo-font-heading);
		font-weight: 900;
		font-size: 2.75rem;
		line-height: 1;
		color: var(--espoo-apricot);
	}

	.score__number small {
		font-size: 1.1rem;
		font-weight: 700;
		opacity: 0.75;
	}

	.report__summary {
		font-size: 1.0625rem;
	}

	section {
		display: grid;
		gap: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1rem;
	}

	@media (min-width: 50em) {
		.grid--2 {
			grid-template-columns: 1fr 1fr;
		}

		.grid--3 {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Numbered blocks: decision, evidence, meeting */
	.block {
		padding-top: 1.25rem;
		border-top: 1px solid var(--espoo-border-strong);
	}

	.block__title {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.block__title span {
		display: inline-grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background-color: var(--espoo-deep);
		color: var(--espoo-glow);
		font-size: 0.9rem;
	}

	.clamp {
		display: -webkit-box;
		-webkit-line-clamp: 6;
		line-clamp: 6;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.skills {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.skill {
		display: grid;
		align-content: start;
		gap: 0.65rem;
		padding: 1.25rem;
		background-color: var(--espoo-midnight);
	}

	.skill__head {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		color: var(--espoo-apricot);
	}

	blockquote {
		margin: 0;
		padding-left: 0.75rem;
		border-left: 3px solid var(--espoo-apricot);
		font-style: italic;
		font-size: 0.925rem;
	}

	ul {
		margin: 0;
		padding-left: 1.2rem;
	}

	.rounds {
		display: grid;
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rounds h4 {
		margin-bottom: 0.6rem;
	}
</style>
