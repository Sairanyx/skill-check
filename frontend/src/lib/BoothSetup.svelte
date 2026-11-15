<script>
	import { EspooAlert, EspooButton, EspooField, EspooHero, EspooSpinner } from './espoo/index.js';
	import { api } from './api.js';
	import { LANGUAGES } from './format.js';

	/**
	 * Choosing what to be interviewed for: a ready-made role, or a scenario typed on the spot
	 * (saved with POST /api/roles first). Calls `onstart(roleId, language)` when ready.
	 */
	let { roles, starting, error, onaddrole, onstart } = $props();

	const CUSTOM = 'custom';
	const CUSTOM_COMPANY = 'Your own task (synthetic)';
	/** Used when the person doesn't name any skills: the panel still needs something to score. */
	const DEFAULT_SKILLS = ['Practical know-how', 'Problem solving', 'Safety and quality'];
	const EMPTY_CUSTOM = { title: '', summary: '', skills: '' };

	let choice = $state('');
	let language = $state('en');
	let custom = $state({ ...EMPTY_CUSTOM });
	let creating = $state(false);
	let createError = $state('');

	const selected = $derived(choice === CUSTOM ? CUSTOM : (roles.find((r) => r.id === choice) ?? roles[0]).id);
	const busy = $derived(starting || creating);

	function customRole() {
		const skills = custom.skills
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		return {
			company: CUSTOM_COMPANY,
			title: custom.title.trim(),
			summary: custom.summary.trim(),
			skills: skills.length ? skills : DEFAULT_SKILLS
		};
	}

	async function submit(event) {
		event.preventDefault();
		createError = '';
		if (selected !== CUSTOM) return onstart(selected, language);

		creating = true;
		try {
			const role = await api.createRole(customRole());
			onaddrole(role);
			choice = role.id;
			custom = { ...EMPTY_CUSTOM };
			onstart(role.id, language);
		} catch (e) {
			createError = e.message;
		} finally {
			creating = false;
		}
	}
</script>

{#snippet roleCard(value, company, title, summary, footnote)}
	<label class="role" class:selected={selected === value}>
		<input
			class="visually-hidden"
			type="radio"
			name="role"
			{value}
			checked={selected === value}
			disabled={busy}
			onchange={() => (choice = value)}
		/>
		<span class="espoo-muted role__small">{company}</span>
		<strong class="role__title">{title}</strong>
		<span>{summary}</span>
		<span class="espoo-muted role__small">{footnote}</span>
	</label>
{/snippet}

<EspooHero
	title="No CV. No cover letter. Just talk about your skills."
	lead="Take a short skill check in a City EXAM room, in Finnish, Swedish or English. People decide whom to meet."
>
	{#snippet aside()}
		<ol class="steps">
			<li>
				<strong>Come to the EXAM room</strong>
				<span>A supervised City computer. Just you and a real task from the company.</span>
			</li>
			<li>
				<strong>Talk about your skills</strong>
				<span>An AI panel of three Gemini 4 models asks about the task.</span>
			</li>
			<li>
				<strong>People decide</strong>
				<span>The company sees your feedback under an alias and chooses whom to meet.</span>
			</li>
		</ol>
	{/snippet}
</EspooHero>

<section class="espoo-container espoo-section">
	<form class="setup" onsubmit={submit}>
		<div class="setup__head">
			<div>
				<h2 id="role-heading">Choose a skill check</h2>
				<a class="espoo-arrow-link setup__sample" href="#review">No time? See a finished result</a>
			</div>
			<div class="setup__go">
				<EspooField label="Language" for="language">
					<select id="language" class="espoo-input" bind:value={language} disabled={busy}>
						{#each LANGUAGES as lang (lang.value)}
							<option value={lang.value}>{lang.label}</option>
						{/each}
					</select>
				</EspooField>
				<EspooButton type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start skill check'}</EspooButton>
			</div>
		</div>

		{#if busy}
			<EspooSpinner>The panel is preparing your first question. This takes about 15 seconds.</EspooSpinner>
		{/if}
		{#if error || createError}<EspooAlert variant="alert">{error || createError}</EspooAlert>{/if}

		<div class="roles" role="radiogroup" aria-labelledby="role-heading">
			{#each roles as r (r.id)}
				{@render roleCard(r.id, r.company, r.title, r.summary, `Skills checked: ${r.skills.join(' · ')}`)}
			{/each}
			{@render roleCard(
				CUSTOM,
				'Any job you can describe',
				'Your own task',
				'Type any job, for example a plumber, a chef or a forklift driver. The panel asks about it.',
				'For judges: try to fool it.'
			)}
		</div>

		{#if selected === CUSTOM}
			<fieldset class="custom" disabled={busy}>
				<legend>Describe the job</legend>
				<EspooField label="Job title" for="custom-title">
					<input
						id="custom-title"
						class="espoo-input"
						required
						maxlength="80"
						placeholder="Plumber"
						bind:value={custom.title}
					/>
				</EspooField>
				<EspooField
					label="What should they be able to do?"
					for="custom-summary"
					hint="The panel builds its questions from this."
				>
					<textarea
						id="custom-summary"
						class="espoo-input"
						required
						maxlength="600"
						rows="3"
						placeholder="Repair a running toilet and a leaking pipe under the sink in an older Espoo apartment, without causing water damage."
						bind:value={custom.summary}
					></textarea>
				</EspooField>
				<EspooField
					label="Skills to check (optional, one per line)"
					for="custom-skills"
					hint="Leave empty to check know-how, problem solving and safety."
				>
					<textarea
						id="custom-skills"
						class="espoo-input"
						rows="3"
						placeholder={'Finding the leak\nValves and seals\nAvoiding water damage'}
						bind:value={custom.skills}
					></textarea>
				</EspooField>
			</fieldset>
		{/if}

	</form>

</section>

<style>
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

	.role__small {
		font-size: 0.85rem;
	}

	.role__title {
		font-family: var(--espoo-font-heading);
		font-size: 1.25rem;
		color: var(--espoo-apricot);
	}

	.custom {
		display: grid;
		gap: 1rem;
		max-width: 40rem;
		margin: 0;
		padding: 1.25rem 1.4rem;
		background-color: var(--espoo-midnight);
		border: 0;
		border-left: 3px solid var(--espoo-apricot);
	}

	legend {
		float: left;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1.1875rem;
		color: var(--espoo-apricot);
	}

	.setup__head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--espoo-border);
	}

	.setup__sample {
		margin-top: 0.75rem;
		font-size: 0.95rem;
	}

	.setup__go {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1rem;
	}
</style>
