<script>
	import { onMount } from 'svelte';
	import { EspooAlert, EspooBadge, EspooSpinner } from './espoo/index.js';
	import Report from './Report.svelte';
	import { api, waitForReport } from './api.js';
	import { STATUS_LABELS, findRole, formatDate, scoreTone, verdictLabel } from './format.js';
	import { SAMPLE_INTERVIEWS } from './samples.js';

	/** `selectedId` comes from the address (#review/<id>); empty means "the newest finished one". */
	let { roles, selectedId } = $props();

	const samplesById = new Map(SAMPLE_INTERVIEWS.map((i) => [i.id, i]));

	/** Same shape as a GET /api/review row, so samples and live interviews list alike. */
	const sampleRows = SAMPLE_INTERVIEWS.map((i) => ({
		id: i.id,
		role_id: i.role_id,
		status: i.status,
		score: i.report.how_good_or_bad,
		is_person_good: i.report.is_person_good,
		created_at: i.created_at,
		tagline: i.tagline
	}));

	let liveRows = $state([]);
	/** @type {Record<string, any>} full interviews fetched from the server, by id */
	let loaded = $state({});
	let reloads = $state(0);
	let error = $state('');
	/** @type {HTMLElement | undefined} */
	let reportSlot = $state();

	const rows = $derived([...liveRows, ...sampleRows]);
	const currentId = $derived(selectedId || (rows.find((r) => r.status === 'done') ?? rows[0])?.id);
	const current = $derived(samplesById.get(currentId) ?? loaded[currentId]);

	onMount(refreshList);

	// Load the selected live interview, and keep polling while its report is being written.
	$effect(() => {
		const id = currentId;
		reloads; // re-run after a retry
		if (!id || samplesById.has(id)) return;
		const controller = new AbortController();
		load(id, controller.signal);
		return () => controller.abort();
	});

	// On phones the list sits above the report: bring the chosen report into view.
	$effect(() => {
		if (selectedId && !matchMedia('(min-width: 64em)').matches) reportSlot?.scrollIntoView();
	});

	async function refreshList() {
		try {
			liveRows = await api.reviews();
		} catch (e) {
			error = `Live interviews couldn't be loaded (${e.message}). The samples still work.`;
		}
	}

	async function load(id, signal) {
		try {
			loaded[id] = await api.review(id);
			if (loaded[id].status !== 'reporting') return;
			const settled = await waitForReport(() => api.review(id), signal);
			if (settled) {
				loaded[id] = settled;
				refreshList();
			}
		} catch (e) {
			error = e.message;
		}
	}

	async function retry() {
		try {
			await api.retryReport(currentId);
			reloads++;
		} catch (e) {
			error = e.message;
		}
	}
</script>

<section class="espoo-container espoo-section">
	<header class="reviews__head">
		<h1>Results</h1>
		<p class="espoo-muted">The panel recommends. People decide whom to meet.</p>
	</header>

	{#if error}<EspooAlert variant="alert">{error}</EspooAlert>{/if}

	<div class="reviews__layout">
		<nav aria-label="Skill checks">
			<ul class="list">
				{#each rows as row (row.id)}
					<li>
						<a href="#review/{row.id}" class:selected={row.id === currentId} aria-current={row.id === currentId}>
							<strong>{findRole(roles, row.role_id).title}</strong>
							<span class="espoo-muted">{row.tagline ?? formatDate(row.created_at)}</span>
							<span class="list__badges">
								{#if row.tagline}<EspooBadge>Sample</EspooBadge>{/if}
								{#if row.status === 'done'}
									<EspooBadge tone={scoreTone(row.score)}>
										{row.score}/10 · {verdictLabel(row.is_person_good)}
									</EspooBadge>
								{:else}
									<EspooBadge tone={row.status === 'failed' ? 'alert' : 'outline'}>{STATUS_LABELS[row.status]}</EspooBadge>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div bind:this={reportSlot}>
			{#if current}
				<Report interview={current} role={findRole(roles, current.role_id)} onretry={retry} />
			{:else if currentId}
				<EspooSpinner>Loading…</EspooSpinner>
			{/if}
		</div>
	</div>
</section>

<style>
	.reviews__head {
		display: grid;
		gap: 0.4rem;
	}

	.reviews__layout {
		display: grid;
		gap: 2rem;
		align-items: start;
	}

	@media (min-width: 64em) {
		.reviews__layout {
			grid-template-columns: 19rem minmax(0, 1fr);
		}

		nav {
			position: sticky;
			top: 1rem;
		}
	}

	.list {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.list a {
		display: grid;
		gap: 0.15rem;
		padding: 0.7rem 0.95rem;
		color: var(--espoo-white);
		text-decoration: none;
		background-color: var(--espoo-midnight);
		border-left: 3px solid transparent;
		transition: border-color var(--espoo-ease);
		border-radius: var(--espoo-radius);
		border: 2px solid var(--espoo-border);
	}

	.list a:hover {
		border-left-color: var(--espoo-border-strong);
	}

	.list a.selected {
		border-left-color: var(--espoo-apricot);
	}

	.list strong {
		font-family: var(--espoo-font-heading);
		color: var(--espoo-apricot);
	}

	.list .espoo-muted {
		font-size: var(--text-sm);
	}

	.list__badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
</style>
