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
	const CUSTOM_COMPANY = 'Your own scenario (synthetic)';
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

<form onsubmit={submit}>
<EspooHero
	title="Show what you can do, not what your CV says"
	lead="Solve real problems from the job you want, in your own words. No CV, no phone, no points for grammar — only your skill counts."
>
	{#snippet actions()}
		<div class="hero-launch">
			<EspooField label="Interview language" for="language">
				<select id="language" class="espoo-input" bind:value={language} disabled={busy}>
					{#each LANGUAGES as lang (lang.value)}
						<option value={lang.value}>{lang.label}</option>
					{/each}
				</select>
			</EspooField>
			<EspooButton type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start interview'}</EspooButton>
		</div>
		<div class="hero-links">
			<a class="espoo-arrow-link" href="#demo">Watch 2-min demo</a>
			<a class="espoo-arrow-link" href="#review">Sample results</a>
		</div>
		{#if busy}
			<EspooSpinner>The panel is preparing your first question. This takes about 15 seconds.</EspooSpinner>
		{/if}
		{#if error || createError}<EspooAlert variant="alert">{error || createError}</EspooAlert>{/if}
	{/snippet}

	{#snippet aside()}
		<ol class="steps">
			<li>
				<strong>Book an EXAM room</strong>
				<span>A supervised City computer, like Finnish universities use. No phone, no ChatGPT — really you.</span>
			</li>
			<li>
				<strong>Talk it through</strong>
				<span>Three AI panelists listen and agree together on each next question.</span>
			</li>
			<li>
				<strong>Gemma pseudonyms & people decide</strong>
				<span>Gemma in Finland strips your name into a pseudonym before scoring; employers choose whom to meet.</span>
			</li>
		</ol>
	{/snippet}
</EspooHero>

<section class="espoo-container espoo-section">
	<div class="setup">
		<h2 id="role-heading">Which job are you here for?</h2>

		<div class="roles" role="radiogroup" aria-labelledby="role-heading">
			{#each roles as r (r.id)}
				{@render roleCard(r.id, r.company, r.title, r.summary, `Assessed: ${r.skills.join(' · ')}`)}
			{/each}
			{@render roleCard(
				CUSTOM,
				'Any job you can describe',
				'Your own scenario',
				'Type the job you want to test — a plumber, a chef, a forklift driver — and the panel interviews for it.',
				'Good for judges: try to fool it.'
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
					hint="The panel builds its scenarios from this."
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
				<div class="setup__go">
					<EspooButton type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start custom interview'}</EspooButton>
				</div>
			</fieldset>
		{/if}
	</div>
</section>
</form>

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
		border: 1.5px solid var(--espoo-tint);
		border-radius: 50%;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		color: var(--espoo-tint);
	}

	.steps span {
		color: rgba(255, 255, 255, 0.85);
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
		background-color: var(--espoo-white);
		border: 2px solid var(--espoo-border);
		border-radius: var(--espoo-radius);
		cursor: pointer;
		transition: border-color var(--espoo-ease), box-shadow var(--espoo-ease);
	}

	.role:hover {
		border-color: var(--espoo-border-strong);
	}

	.role.selected {
		border-color: var(--espoo-blue);
		background-color: var(--espoo-tint);
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

	.setup__go {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1rem;
	}

	.hero-launch {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.9rem;
	}

	.hero-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
</style>
