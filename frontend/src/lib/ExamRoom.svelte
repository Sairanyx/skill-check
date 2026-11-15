<script>
	import { onDestroy, tick } from 'svelte';
	import { EspooAlert, EspooButton, EspooCard, EspooField, EspooSpinner } from './espoo/index.js';
	import ExamRoomSetup from './ExamRoomSetup.svelte';
	import ReadinessMeter from './ReadinessMeter.svelte';
	import RoundNotes from './RoundNotes.svelte';
	import Transcript from './Transcript.svelte';
	import { api, waitForReport } from './api.js';
	import { SAMPLE_ANSWERS } from './samples.js';

	let { roles, onaddrole } = $props();

	/** @type {'setup' | 'starting' | 'active' | 'sending' | 'reporting' | 'done' | 'failed'} */
	let status = $state('setup');
	let roleId = $state('');
	let interviewId = $state('');
	/** How close the panel is to a result (0–100); null if the server doesn't say. */
	let progress = $state(null);
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

	/** Keeps the last known value when an older server sends no `progress`. */
	function updateProgress(value) {
		if (typeof value === 'number') progress = value;
	}

	async function start(chosenRoleId, language) {
		error = '';
		roleId = chosenRoleId;
		status = 'starting';
		try {
			const step = await api.startInterview(chosenRoleId, language);
			interviewId = step.id;
			transcript = [{ speaker: 'interviewer', text: step.message }];
			updateProgress(step.progress);
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
			const step = await api.sendMessage(interviewId, text);
			transcript = [...transcript, { speaker: 'interviewer', text: step.message }];
			updateProgress(step.progress);
			refreshPanelNotes();
			if (step.done) awaitReport();
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
		progress = null;
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

{#if status === 'setup' || status === 'starting'}
	<ExamRoomSetup {roles} starting={status === 'starting'} {error} {onaddrole} onstart={start} />
{:else}
	<section class="espoo-container espoo-section interview">
		<div class="chat">
			<header class="chat__head">
				<div>
					<span class="espoo-muted">EXAM room · {role.company}</span>
					<h2>{role.title}</h2>
				</div>
				{#if canReply && hasAnswered}
					<EspooButton variant="secondary" size="sm" onclick={finish}>End skill check</EspooButton>
				{/if}
			</header>

			{#if progress !== null}
				<ReadinessMeter value={status === 'reporting' || status === 'done' ? 100 : progress} />
			{/if}

			<Transcript turns={transcript} candidateName="You" />

			{#if status === 'sending'}
				<EspooSpinner>The panel is discussing your answer. This takes about 15 seconds.</EspooSpinner>
			{/if}
			{#if error}<EspooAlert variant="alert">{error}</EspooAlert>{/if}

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
					<EspooSpinner>Thank you! The panel is writing its report. This takes 1 to 2 minutes.</EspooSpinner>
				{:else if status === 'done'}
					<EspooCard title="Thank you. Here is your feedback">
						<p>{feedback}</p>
					</EspooCard>
				{:else}
					<EspooAlert variant="alert" title="The report couldn't be written">
						You can try again from the report page.
					</EspooAlert>
				{/if}
				<div class="outcome-actions">
					<EspooButton href="#review/{interviewId}">See what the company sees</EspooButton>
					<EspooButton variant="secondary" onclick={reset}>New skill check</EspooButton>
				</div>
			{/if}
			<span bind:this={chatEnd}></span>
		</div>

		<aside class="notes" aria-labelledby="notes-heading">
			<h3 id="notes-heading">Behind the scenes</h3>
			<p class="espoo-muted">
				After every answer, each panelist writes private notes and suggests a question. The chair picks
				one. Only staff see this, never the candidate.
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
		font-size: var(--text-sm);
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
		font-size: var(--text-sm);
	}
</style>
