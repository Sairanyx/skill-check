<script>
	import { EspooAlert, EspooBadge } from './espoo/index.js';
	import { kindOf, scoreTone } from './format.js';
	import { PANELIST_FOCUS } from './samples.js';

	/** One round of panel deliberation: three private memos and the chair's decision. */
	let { round } = $props();
</script>

<div class="round">
	{#if round.overruled}
		<EspooAlert variant="note" title="The rules overruled the chair">{round.overruled}</EspooAlert>
	{/if}

	<p><strong class="round__label">Chair's decision:</strong> {round.chair_reasoning}</p>

	<ul class="memos">
		{#each round.memos as memo (memo.panelist)}
			{@const kind = kindOf(memo.reads_last_message_as)}
			<li class="memo">
				<div class="memo__head">
					<strong>{memo.panelist}</strong>
					<span class="espoo-muted">{PANELIST_FOCUS[memo.panelist]}</span>
				</div>
				<!-- Before the candidate's first answer there is nothing to score yet. -->
				{#if kind}
					<div class="memo__badges">
						<EspooBadge tone={scoreTone(memo.provisional_score)}>{memo.provisional_score}/10 so far</EspooBadge>
						<EspooBadge tone={kind.tone}>Read it as: {kind.label}</EspooBadge>
					</div>
				{/if}
				<p>{memo.observations}</p>
				<p class="espoo-muted memo__ask">Would ask next: {memo.proposed_question}</p>
			</li>
		{/each}
	</ul>
</div>

<style>
	.round {
		display: grid;
		gap: 0.85rem;
		font-size: 0.925rem;
	}

	.round__label {
		color: var(--espoo-apricot);
	}

	.memos {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.memo {
		display: grid;
		align-content: start;
		gap: 0.45rem;
		padding: 0.9rem 1rem;
		background-color: var(--espoo-navy);
		border: 1px solid var(--espoo-border);
	}

	.memo__head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
	}

	.memo__head strong {
		color: var(--espoo-apricot);
	}

	.memo__badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.memo__ask {
		padding-top: 0.45rem;
		border-top: 1px dashed var(--espoo-border);
		font-size: 0.85rem;
	}
</style>
