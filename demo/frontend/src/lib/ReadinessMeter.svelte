<script>
	import { EspooBar } from './espoo/index.js';

	/** What the candidate sees: how close the panel is to a result (0–100, from the server's `progress`). */
	let { value } = $props();
</script>

<div class="meter">
	<div class="meter__label">
		<span>{value >= 100 ? 'The panel has what it needs' : 'How close the panel is to a result'}</span>
		<strong>{value}%</strong>
	</div>
	<EspooBar {value} label="Panel readiness" />
</div>

<style>
	.meter {
		display: grid;
		gap: 0.4rem;
		font-size: var(--text-sm);
	}

	.meter__label {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	strong {
		color: var(--espoo-apricot);
	}
</style>
