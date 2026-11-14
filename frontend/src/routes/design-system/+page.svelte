<script>
	import '../../lib/espoo/tokens.css';
	import {
		EspooAccordion,
		EspooAlert,
		EspooBadge,
		EspooButton,
		EspooCard,
		EspooFooter,
		EspooHeader,
		EspooHero,
		EspooInput,
		EspooSelect
	} from '../../lib/espoo/index.js';

	let darkTheme = $state(false);
	let searchQuery = $state('');
	let applicantName = $state('Aino Virtanen');
	let email = $state('');
	let emailError = $derived(
		email.length > 0 && !email.includes('@') ? 'Please enter a valid email address.' : ''
	);
	let serviceArea = $state('education');
	let notes = $state('');
	let clickCount = $state(0);

	const swatches = [
		{ name: 'Espoo Blue', hex: '#0050BB', role: 'Primary brand, hero, footer, links', darkText: false },
		{ name: 'Deep Navy', hex: '#012169', role: 'Headings, hover states, strong accents', darkText: false },
		{ name: 'Cool Mist', hex: '#DFE5EB', role: 'Accordions, borders, info surfaces', darkText: true },
		{ name: 'Warm Peach', hex: '#FDE6DB', role: 'Menus, neutral colored blocks, warnings', darkText: true },
		{ name: 'Apricot', hex: '#FFC386', role: 'News highlights, dark-mode links', darkText: true },
		{ name: 'Blossom Pink', hex: '#FCA5C7', role: 'Complementary thematic pair, unit info', darkText: true },
		{ name: 'Note Yellow', hex: '#FFDC47', role: 'Notice / announcement banners', darkText: true },
		{ name: 'Alert Coral', hex: '#FF4F57', role: 'Errors and urgent alerts', darkText: false }
	];

	const navLinks = [
		{ label: 'Typography', href: '#typography', active: true },
		{ label: 'Colors', href: '#colors', active: false },
		{ label: 'Components', href: '#components', active: false },
		{ label: 'Forms', href: '#forms', active: false }
	];

	const footerColumns = [
		{
			title: 'Design Foundations',
			links: [
				{ label: 'Color Palette', href: '#colors' },
				{ label: 'Typography Scale', href: '#typography' },
				{ label: 'Focus & Accessibility', href: '#components' }
			]
		},
		{
			title: 'Components',
			links: [
				{ label: 'Buttons & Badges', href: '#components' },
				{ label: 'Cards & Alerts', href: '#cards' },
				{ label: 'Form Controls', href: '#forms' }
			]
		},
		{
			title: 'Reference',
			links: [
				{ label: 'City of Espoo (espoo.fi/en)', href: 'https://www.espoo.fi/en' },
				{ label: 'Back to SkillCheck', href: '/' }
			]
		}
	];
</script>

<svelte:head>
	<title>Espoo UI Component Library — SkillCheck Booth</title>
</svelte:head>

<div class="espoo-root" data-espoo-theme={darkTheme ? 'dark' : 'light'}>
	<EspooHeader
		brand="ESPOO UI"
		brandHref="/design-system"
		subtitle="Component Library Showcase"
		links={navLinks}
	>
		{#snippet actions()}
			<EspooButton
				variant="secondary"
				size="sm"
				onclick={() => (darkTheme = !darkTheme)}
			>
				{darkTheme ? 'Light Theme' : 'Dark Theme'}
			</EspooButton>
		{/snippet}
	</EspooHeader>

	<EspooHero
		eyebrow="Design System · Inspired by espoo.fi/en"
		title="City of Espoo Typography & Component Library"
		lead="A clean, accessible Svelte 5 component kit built on Espoo's Lato + Work Sans type pairing, high-contrast municipal color tokens, and double-offset focus rings."
	>
		{#snippet actions()}
			<EspooButton variant="navy" href="#components">Explore Components</EspooButton>
			<EspooButton
				variant="secondary"
				href="#forms"
				style="border-color: #ffffff; color: #ffffff;"
			>
				Try Form Controls
			</EspooButton>
		{/snippet}
	</EspooHero>

	<main class="showcase-main">
		<!-- Colors -->
		<section id="colors" class="showcase-section">
			<div class="section-head">
				<h2>Color Palette</h2>
				<p>
					Core brand, thematic surface, and semantic feedback colors extracted from
					<code>espoo.fi</code>.
				</p>
			</div>

			<div class="swatch-grid">
				{#each swatches as swatch}
					<div class="swatch-card">
						<div
							class="swatch-color"
							style="background-color: {swatch.hex}; color: {swatch.darkText ? '#000000' : '#ffffff'};"
						>
							<span class="swatch-hex">{swatch.hex}</span>
						</div>
						<div class="swatch-meta">
							<div class="swatch-name">{swatch.name}</div>
							<div class="swatch-role">{swatch.role}</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Typography -->
		<section id="typography" class="showcase-section">
			<div class="section-head">
				<h2>Typography</h2>
				<p>
					<strong>Lato</strong> for headings, navigation, and buttons; <strong>Work Sans</strong>
					for body copy and form inputs.
				</p>
			</div>

			<div class="type-stack">
				<div class="type-row">
					<span class="type-label">H1 · Lato 400 · 40px / 50px</span>
					<h1>Espoo is the capital of children and youth</h1>
				</div>
				<div class="type-row">
					<span class="type-label">H2 · Lato 400 · 30px / 38px</span>
					<h2>Services, events, and city news</h2>
				</div>
				<div class="type-row">
					<span class="type-label">H3 · Lato 700 · 20px / 26px</span>
					<h3>Early childhood education and schools</h3>
				</div>
				<div class="type-row">
					<span class="type-label">Body · Work Sans 400 · 18px / 28px</span>
					<p style="margin: 0;">
						Espoo provides clear, accessible digital services for residents, families, and
						businesses. Inline <a href="#typography" class="espoo-link">text links</a> use
						high-contrast Espoo Blue with crisp underlines.
					</p>
				</div>
			</div>
		</section>

		<!-- Buttons & Badges -->
		<section id="components" class="showcase-section">
			<div class="section-head">
				<h2>Buttons & Badges</h2>
				<p>Tab through buttons to see Espoo's signature double-offset focus ring.</p>
			</div>

			<div class="demo-box">
				<div class="row-wrap">
					<EspooButton variant="primary" onclick={() => clickCount++}>
						Primary Action ({clickCount})
					</EspooButton>
					<EspooButton variant="secondary">Secondary Outline</EspooButton>
					<EspooButton variant="navy">Deep Navy</EspooButton>
					<EspooButton variant="ghost">Ghost Button</EspooButton>
					<EspooButton variant="alert">Alert Action</EspooButton>
					<EspooButton variant="primary" disabled>Disabled</EspooButton>
				</div>

				<div class="row-wrap" style="margin-top: 1.25rem;">
					<EspooButton size="sm" variant="secondary">Small</EspooButton>
					<EspooButton size="md" variant="secondary">Medium (Default)</EspooButton>
					<EspooButton size="lg" variant="secondary">Large</EspooButton>
				</div>

				<div class="row-wrap" style="margin-top: 1.5rem;">
					<EspooBadge variant="blue">City Services</EspooBadge>
					<EspooBadge variant="navy">Official Notice</EspooBadge>
					<EspooBadge variant="mist">Housing</EspooBadge>
					<EspooBadge variant="peach">Culture</EspooBadge>
					<EspooBadge variant="apricot">News</EspooBadge>
					<EspooBadge variant="blossom">Family & Youth</EspooBadge>
					<EspooBadge variant="note">Reminder</EspooBadge>
					<EspooBadge variant="alert">Urgent</EspooBadge>
				</div>
			</div>
		</section>

		<!-- Alerts -->
		<section class="showcase-section">
			<div class="section-head">
				<h2>Alerts & Notices</h2>
				<p>Semantic notification banners with optional dismiss action.</p>
			</div>

			<div class="stack">
				<EspooAlert variant="info" title="Service update">
					Library hours have been updated for the autumn season across Espoo.
				</EspooAlert>
				<EspooAlert variant="note" title="Important reminder" dismissible>
					Applications for spring clubs close on Friday at 16:00.
				</EspooAlert>
				<EspooAlert variant="warning" title="Scheduled maintenance">
					Online appointment booking will be unavailable tonight from 23:00 to 01:00.
				</EspooAlert>
				<EspooAlert variant="alert" title="Disruption notice">
					Metro service between Tapiola and Matinkylä is temporarily replaced by buses.
				</EspooAlert>
			</div>
		</section>

		<!-- Cards -->
		<section id="cards" class="showcase-section">
			<div class="section-head">
				<h2>Cards & Thematic Surfaces</h2>
				<p>Content blocks matching Espoo's neutral and thematic color pairs.</p>
			</div>

			<div class="card-grid">
				<EspooCard variant="default" eyebrow="Service" title="Default Content Card" elevated>
					Standard white card with <code>#DFE5EB</code> border and subtle elevation shadow.
					{#snippet footer()}
						<EspooButton size="sm" variant="secondary">Read more</EspooButton>
					{/snippet}
				</EspooCard>

				<EspooCard variant="mist" eyebrow="Info" title="Cool Mist (#DFE5EB)">
					Used for neutral medium content blocks, metadata summaries, and sidebars.
				</EspooCard>

				<EspooCard variant="peach" eyebrow="Highlight" title="Warm Peach (#FDE6DB)">
					Used for featured menus, thematic callouts, and warm editorial sections.
				</EspooCard>

				<EspooCard variant="apricot" eyebrow="News" title="Apricot (#FFC386)">
					Used on espoo.fi for news highlights and timely announcements.
				</EspooCard>

				<EspooCard variant="blossom" eyebrow="Unit Info" title="Blossom Pink (#FCA5C7)">
					Complementary thematic pair surface for unit info and community spotlights.
				</EspooCard>

				<EspooCard variant="blue" eyebrow="Featured" title="Espoo Blue (#0050BB)">
					High-impact thematic card with crisp white typography.
				</EspooCard>
			</div>
		</section>

		<!-- Forms -->
		<section id="forms" class="showcase-section">
			<div class="section-head">
				<h2>Form Controls</h2>
				<p>Accessible inputs using Work Sans, 2px borders, and clear validation feedback.</p>
			</div>

			<form
				class="demo-box form-grid"
				onsubmit={(e) => {
					e.preventDefault();
				}}
			>
				<EspooInput
					label="Search services"
					type="search"
					placeholder="e.g. daycare, library, swimming hall..."
					bind:value={searchQuery}
				/>

				<EspooInput
					label="Full name"
					required
					hint="Enter your first and last name."
					bind:value={applicantName}
				/>

				<EspooInput
					label="Email address"
					type="email"
					placeholder="name@example.fi"
					error={emailError}
					hint="Try typing an invalid email without '@' to preview error styling."
					bind:value={email}
				/>

				<EspooSelect
					label="Service area"
					bind:value={serviceArea}
					options={[
						{ value: 'education', label: 'Education & Early Childhood' },
						{ value: 'housing', label: 'Housing & Environment' },
						{ value: 'culture', label: 'Culture & Sports' },
						{ value: 'business', label: 'Work & Entrepreneurship' }
					]}
				/>

				<div style="grid-column: 1 / -1;">
					<EspooInput
						label="Additional details"
						multiline
						rows={3}
						placeholder="Write a short message..."
						bind:value={notes}
					/>
				</div>

				<div style="grid-column: 1 / -1; display: flex; gap: 0.75rem; flex-wrap: wrap;">
					<EspooButton type="submit" variant="primary">Submit Form</EspooButton>
					<EspooButton
						type="button"
						variant="ghost"
						onclick={() => {
							searchQuery = '';
							email = '';
							notes = '';
						}}
					>
						Reset
					</EspooButton>
				</div>
			</form>
		</section>

		<!-- Accordions -->
		<section class="showcase-section">
			<div class="section-head">
				<h2>Accordions</h2>
				<p>Expandable sections styled with <code>--backgrounds--accordion (#DFE5EB)</code>.</p>
			</div>

			<div class="stack">
				<EspooAccordion title="What fonts does espoo.fi use?" open={true}>
					Espoo.fi pairs <strong>Lato</strong> (weights 300, 400, 700, 900) for headings, links,
					and buttons with <strong>Work Sans</strong> (weights 400, 600) for body paragraphs and
					form controls.
				</EspooAccordion>
				<EspooAccordion title="How are focus states handled for accessibility?">
					Interactive controls use a 2px (<code>0.125rem</code>) outer focus ring offset from the
					element border so keyboard navigation remains clearly visible against any background.
				</EspooAccordion>
				<EspooAccordion title="Does this library support dark mode?">
					Yes! Toggle <strong>Dark Theme</strong> in the header above to switch all semantic
					tokens to Espoo's deep navy (<code>#011135</code> / <code>#012169</code>) and apricot
					(<code>#FFC386</code>) dark palette.
				</EspooAccordion>
			</div>
		</section>
	</main>

	<EspooFooter columns={footerColumns} />
</div>

<style>
	.showcase-main {
		max-width: 76rem;
		margin: 0 auto;
		padding: 2.5rem var(--spacing--basicPadding) 4rem;
		display: flex;
		flex-direction: column;
		gap: 3.5rem;
	}

	.showcase-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-head p {
		margin: 0.35rem 0 0;
		color: var(--typography--placeholder);
	}

	.swatch-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
		gap: 1rem;
	}

	.swatch-card {
		border: 0.125rem solid var(--backgrounds--border);
		border-radius: var(--espoo-radius);
		overflow: hidden;
		background-color: var(--backgrounds--block);
	}

	.swatch-color {
		height: 5rem;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: flex-end;
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.9375rem;
		letter-spacing: 0.04em;
	}

	.swatch-meta {
		padding: 0.875rem 1rem;
	}

	.swatch-name {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 1rem;
		color: var(--typography--header);
	}

	.swatch-role {
		font-size: 0.875rem;
		line-height: 1.3rem;
		color: var(--typography--placeholder);
		margin-top: 0.25rem;
	}

	.type-stack {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		border: 0.125rem solid var(--backgrounds--border);
		border-radius: var(--espoo-radius);
		background-color: var(--backgrounds--block);
	}

	.type-row {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--backgrounds--border);
	}

	.type-row:last-child {
		padding-bottom: 0;
		border-bottom: 0;
	}

	.type-label {
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		font-size: 0.8125rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--typography--placeholder);
	}

	.demo-box {
		padding: 1.5rem;
		border: 0.125rem solid var(--backgrounds--border);
		border-radius: var(--espoo-radius);
		background-color: var(--backgrounds--block);
	}

	.row-wrap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.875rem;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
		gap: 1.25rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1.25rem;
	}
</style>
