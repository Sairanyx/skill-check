<script>
	import { EspooBadge } from './espoo/index.js';
	import { kindOf } from './format.js';

	/**
	 * @type {{
	 *   turns: Array<{ speaker: 'interviewer' | 'candidate', text: string, kind?: string }>,
	 *   candidateName?: string,
	 *   showKinds?: boolean
	 * }}
	 */
	let { turns, candidateName = 'Candidate', showKinds = false } = $props();
</script>

<ol class="transcript">
	{#each turns as turn, i (i)}
		{@const kind = showKinds ? kindOf(turn.kind) : undefined}
		<li class="turn turn--{turn.speaker}">
			<span class="turn__who">
				{turn.speaker === 'interviewer' ? 'Interviewer' : candidateName}
				{#if kind}<EspooBadge tone={kind.tone}>{kind.label}</EspooBadge>{/if}
			</span>
			<p>{turn.text}</p>
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
	}

	.turn--interviewer {
		justify-self: start;
		background-color: var(--espoo-midnight);
		border-left: 0.25rem solid var(--espoo-apricot);
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
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--espoo-apricot);
	}

	.turn--candidate .turn__who {
		color: var(--espoo-white);
	}

	p {
		white-space: pre-line;
	}
</style>
