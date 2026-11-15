<script>
	import { EspooBadge } from './espoo/index.js';
	import { kindOf } from './format.js';
	import Redacted from './Redacted.svelte';

	/**
	 * @type {{
	 *   turns: Array<{ speaker: 'interviewer' | 'candidate', text: string, seen?: string, kind?: string }>,
	 *   redacted?: boolean,
	 *   candidateName?: string,
	 *   showKinds?: boolean
	 * }}
	 */
	/** `redacted`: show candidate answers as the panel read them (company and City views). */
	let { turns, candidateName = 'Candidate', showKinds = false, redacted = false } = $props();
</script>

<ol class="transcript">
	{#each turns as turn, i (i)}
		{@const kind = showKinds ? kindOf(turn.kind) : undefined}
		<li class="turn turn--{turn.speaker}">
			<span class="turn__who">
				{turn.speaker === 'interviewer' ? 'Interviewer' : candidateName}
				{#if kind}<EspooBadge tone={kind.tone}>{kind.label}</EspooBadge>{/if}
			</span>
			{#if redacted && turn.speaker === 'candidate' && turn.seen}
				<p><Redacted text={turn.seen} /></p>
			{:else}
				<p>{turn.text}</p>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.transcript {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.turn {
		display: grid;
		gap: 0.3rem;
		max-width: min(40rem, 92%);
		padding: 0.9rem 1.15rem;
		border-radius: var(--espoo-radius);
	}

	.turn--interviewer {
		justify-self: start;
		background-color: #ffffff;
		border: 2px solid var(--espoo-border);
	}

	.turn--candidate {
		justify-self: end;
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue);
	}

	.turn__who {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--espoo-font-heading);
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--espoo-apricot);
	}

	.turn--candidate .turn__who {
		color: rgba(255, 255, 255, 0.8);
	}

	p {
		white-space: pre-line;
	}
</style>
