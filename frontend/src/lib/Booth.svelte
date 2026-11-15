<script>
	import { onDestroy, tick } from 'svelte';
	import {
		EspooAlert,
		EspooButton,
		EspooCard,
		EspooField,
		EspooHero,
		EspooSpinner
	} from './espoo/index.js';
	import RoundNotes from './RoundNotes.svelte';
	import Transcript from './Transcript.svelte';
	import { api, waitForReport } from './api.js';
	import { LANGUAGES } from './format.js';
	import { SAMPLE_ANSWERS } from './samples.js';

	let { roles } = $props();

	/** @type {'setup' | 'starting' | 'active' | 'sending' | 'reporting' | 'done' | 'failed'} */
	let status = $state('setup');
	let roleId = $state('');
	let language = $state('en');
	let interviewId = $state('');
	/** @type {Array<{ speaker: 'interviewer' | 'candidate', text: string }>} */
	let transcript = $state([]);
	let latestRound = $state(null);
	let feedback = $state('');
	let draft = $state('');
	let error = $state('');
	/** @type {HTMLElement | undefined} */
	let chatEnd = $state();
	/** @type {AbortController | undefined} */
	let reportWait;

	const role = $derived(roles.find((r) => r.id === roleId) ?? roles[0]);
	const sampleAnswers = $derived(SAMPLE_ANSWERS[role.id] ?? []);
	const canReply = $derived(status === 'active');
	const hasAnswered = $derived(transcript.some((t) => t.speaker === 'candidate'));

	onDestroy(() => reportWait?.abort());

	async function start(event) {
		event.preventDefault();
		error = '';
		status = 'starting';
		try {
			const { id, message } = await api.startInterview(role.id, language);
			interviewId = id;
			transcript = [{ speaker: 'interviewer', text: message }];
			status = 'active';
			refreshPanelNotes();
			await tick();
			scrollTo(0, 0);
		} catch (e) {
			error = e.message;
			status = 'setup';
		}
	}

	async function send(event) {
		event?.preventDefault();
		const text = draft.trim();
		if (!text || !canReply) return;

		error = '';
		draft = '';
		status = 'sending';
		transcript = [...transcript, { speaker: 'candidate', text }];
		scrollToEnd();
		try {
			const { message, done } = await api.sendMessage(interviewId, text);
			transcript = [...transcript, { speaker: 'interviewer', text: message }];
			refreshPanelNotes();
			if (done) awaitReport();
			else status = 'active';
		} catch (e) {
			transcript = transcript.slice(0, -1);
			draft = text;
			error = e.message;
			status = 'active';
		}
		scrollToEnd();
	}

	async function finish() {
		error = '';
		status = 'sending';
		try {
			await api.finishInterview(interviewId);
			awaitReport();
		} catch (e) {
			error = e.message;
			status = 'active';
		}
	}

	async function awaitReport() {
		status = 'reporting';
		reportWait = new AbortController();
		const result = await waitForReport(() => api.candidateView(interviewId), reportWait.signal);
		if (!result) return;
		feedback = result.feedback ?? '';
		status = result.status === 'done' ? 'done' : 'failed';
	}

	/** The panel's private memos for the turn just played (shown beside the chat for the demo). */
	async function refreshPanelNotes() {
		const review = await api.review(interviewId).catch(() => null);
		latestRound = review?.rounds.at(-1) ?? latestRound;
	}

	function reset() {
		reportWait?.abort();
		status = 'setup';
		interviewId = '';
		transcript = [];
		latestRound = null;
		feedback = '';
		draft = '';
		error = '';
	}

	async function scrollToEnd() {
		await tick();
		chatEnd?.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}

	/** Enter sends, Shift+Enter starts a new line. */
	function onComposerKey(event) {
		if (event.key === 'Enter' && !event.shiftKey) send(event);
	}
</script>

{#snippet errorAlert()}
	{#if error}<EspooAlert variant="alert">{error}</EspooAlert>{/if}
{/snippet}

{#if status === 'setup' || status === 'starting'}
	<EspooHero
		title="Show what you can do, not what your CV says"
		lead="Solve real problems from the job you want, in your own words. No CV, no phone, no points for grammar — only your skill counts."
	>
		{#snippet aside()}
			<ol class="steps">
				<li>
					<strong>Come to the booth</strong>
					<span>Just you and a real work scenario. Nothing else in the room, so it's really you.</span>
				</li>
				<li>
					<strong>Talk it through</strong>
					<span>Three AI panelists listen and agree together on each next question.</span>
				</li>
				<li>
					<strong>People decide</strong>
					<span>The employer gets a report backed by your own words, and chooses whom to meet.</span>
				</li>
			</ol>
		{/snippet}
	</EspooHero>

	<section class="espoo-container band">
		<form class="setup" onsubmit={start}>
			<h2 id="role-heading">Which job are you here for?</h2>

			<div class="roles" role="radiogroup" aria-labelledby="role-heading">
				{#each roles as r (r.id)}
					<label class="role" class:selected={r.id === role.id}>
						<input
							class="visually-hidden"
							type="radio"
							name="role"
							value={r.id}
							checked={r.id === role.id}
							disabled={status === 'starting'}
							onchange={() => (roleId = r.id)}
						/>
						<span class="espoo-muted role__company">{r.company}</span>
						<strong class="role__title">{r.title}</strong>
						<span>{r.summary}</span>
						<span class="espoo-muted role__skills">Assessed: {r.skills.join(' · ')}</span>
					</label>
				{/each}
			</div>

			<div class="setup__go">
				<EspooField label="Interview language" for="language">
					<select id="language" class="espoo-input" bind:value={language} disabled={status === 'starting'}>
						{#each LANGUAGES as lang (lang.value)}
							<option value={lang.value}>{lang.label}</option>
						{/each}
					</select>
				</EspooField>
				<EspooButton type="submit" disabled={status === 'starting'}>
					{status === 'starting' ? 'Starting…' : 'Start interview'}
				</EspooButton>
			</div>

			{#if status === 'starting'}
				<EspooSpinner>The panel is preparing your first question. This takes about 15 seconds.</EspooSpinner>
			{/if}
			{@render errorAlert()}
		</form>

		<a class="espoo-arrow-link" href="#review">No time for an interview? Read a finished sample report</a>
	</section>
{:else}
	<section class="espoo-container band interview">
		<div class="chat">
			<header class="chat__head">
				<div>
					<span class="espoo-muted">{role.company}</span>
					<h2>{role.title}</h2>
				</div>
				{#if canReply && hasAnswered}
					<EspooButton variant="secondary" size="sm" onclick={finish}>End interview</EspooButton>
				{/if}
			</header>

			<Transcript turns={transcript} candidateName="You" />

			{#if status === 'sending'}
				<EspooSpinner>The panel is discussing your answer. This takes about 15 seconds.</EspooSpinner>
			{/if}
			{@render errorAlert()}

			{#if status === 'active' || status === 'sending'}
				<form class="composer" onsubmit={send}>
					{#if sampleAnswers.length}
						<div class="samples">
							<span class="espoo-muted">Try a sample answer:</span>
							{#each sampleAnswers as sample (sample.label)}
								<EspooButton
									variant="secondary"
									size="sm"
									disabled={!canReply}
									onclick={() => (draft = sample.text)}
								>
									{sample.label}
								</EspooButton>
							{/each}
						</div>
					{/if}
					<EspooField
						label="Your answer"
						for="answer"
						hint="Explain what you would do, step by step. You can also ask about the situation."
					>
						<textarea
							id="answer"
							class="espoo-input"
							rows="4"
							bind:value={draft}
							onkeydown={onComposerKey}
							disabled={!canReply}
						></textarea>
					</EspooField>
					<div>
						<EspooButton type="submit" disabled={!canReply || !draft.trim()}>Send</EspooButton>
					</div>
				</form>
			{:else}
				{#if status === 'reporting'}
					<EspooSpinner>Thank you! The panel is writing its report. This takes 1–2 minutes.</EspooSpinner>
				{:else if status === 'done'}
					<EspooCard title="Thank you — here is your feedback">
						<p>{feedback}</p>
					</EspooCard>
				{:else}
					<EspooAlert variant="alert" title="The report couldn't be written">
						You can try again from the report page.
					</EspooAlert>
				{/if}
				<div class="outcome-actions">
					<EspooButton href="#review/{interviewId}">See the employer's report</EspooButton>
					<EspooButton variant="secondary" onclick={reset}>New interview</EspooButton>
				</div>
			{/if}
			<span bind:this={chatEnd}></span>
		</div>

		<aside class="notes" aria-labelledby="notes-heading">
			<h3 id="notes-heading">Behind the scenes</h3>
			<p class="espoo-muted">
				After every answer, each panelist writes private notes and suggests a question; the chair picks
				one. Only staff see this — never the candidate.
			</p>
			{#if latestRound}
				<RoundNotes round={latestRound} />
			{:else}
				<p class="espoo-muted">The first notes appear with the first question.</p>
			{/if}
		</aside>
	</section>
{/if}

<style>
	.band {
		display: grid;
		gap: 2rem;
		padding-block: 3rem;
	}

	.steps {
		display: grid;
		gap: 1.25rem;
		max-width: 26rem;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.steps li {
		display: grid;
		grid-template-columns: 2.25rem 1fr;
		column-gap: 0.85rem;
		counter-increment: step;
	}

	.steps li::before {
		content: counter(step);
		grid-row: span 2;
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1.5px solid var(--espoo-apricot);
		border-radius: 50%;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		color: var(--espoo-apricot);
	}

	.steps span {
		color: var(--espoo-text-muted);
		font-size: 0.95rem;
	}

	.setup {
		display: grid;
		gap: 1.5rem;
	}

	.roles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1rem;
	}

	.role {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		padding: 1.25rem 1.4rem;
		background-color: var(--espoo-midnight);
		border: 2px solid transparent;
		cursor: pointer;
		transition: border-color var(--espoo-ease);
	}

	.role:hover {
		border-color: var(--espoo-border-strong);
	}

	.role.selected {
		border-color: var(--espoo-apricot);
	}

	.role:has(:focus-visible) {
		outline: 2px solid var(--espoo-apricot);
		outline-offset: 2px;
	}

	.role__company,
	.role__skills {
		font-size: 0.85rem;
	}

	.role__title {
		font-family: var(--espoo-font-heading);
		font-size: 1.25rem;
		color: var(--espoo-apricot);
	}

	.setup__go {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1rem;
	}

	.interview {
		align-items: start;
	}

	@media (min-width: 64em) {
		.interview {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		}
	}

	.chat {
		display: grid;
		gap: 1.25rem;
	}

	.chat__head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--espoo-border);
	}

	.composer {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		background-color: var(--espoo-midnight);
	}

	.samples {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.outcome-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.notes {
		display: grid;
		gap: 0.85rem;
		padding: 1.25rem;
		background-color: var(--espoo-midnight);
		border-top: 3px solid var(--espoo-apricot);
	}

	@media (min-width: 64em) {
		.notes {
			position: sticky;
			top: 1rem;
			max-height: calc(100vh - 2rem);
			overflow-y: auto;
		}
	}

	.notes h3 {
		color: var(--espoo-apricot);
	}

	.notes > p {
		font-size: 0.9rem;
	}
</style>
