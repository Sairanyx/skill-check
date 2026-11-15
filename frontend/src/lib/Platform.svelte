<script>
	/**
	 * The full SkillCheck platform (Next.js app on the dev branch): three portals around the same skill check.
	 * Logins open the live platform with the demo account filled in.
	 */
	const PLATFORM_URL = 'https://skillcheck.fi';
	const PORTALS = [
		{
			as: 'candidate',
			who: 'Jobseeker',
			open: 'Open the jobseeker portal',
			name: 'Aino',
			does: ['Picks an event and the companies to meet', 'Books an EXAM room time', 'Gets feedback and a SkillCheck badge']
		},
		{
			as: 'company',
			who: 'Company',
			open: 'Open the company portal',
			name: 'Kauklahti Parcel',
			does: ['Joins an event and describes one real task', 'Sees results under an alias, never a name', 'Invites people to sit down at the event']
		},
		{
			as: 'city',
			who: 'City of Espoo',
			open: 'Open the City portal',
			name: 'Event staff',
			does: ['Approves companies and runs the EXAM rooms', 'Reviews unclear results', 'Every decision and data access in the audit log']
		}
	];
</script>

<section class="espoo-container espoo-section">
	<header>
		<h1>The full platform</h1>
		<p class="espoo-muted lead">
			SkillCheck also runs as a full platform with three portals: the same skill check and privacy guard, plus events,
			bookings, decisions and the audit log. Demo accounts are filled in.
		</p>
	</header>

	<div class="portals">
		{#each PORTALS as p (p.as)}
			<article class="portal">
				<span class="espoo-muted">{p.name}</span>
				<h2>{p.who}</h2>
				<ul>
					{#each p.does as d (d)}<li>{d}</li>{/each}
				</ul>
				<a class="open" href="{PLATFORM_URL}/en/login?as={p.as}" target="_blank" rel="noreferrer">{p.open} ↗</a>
			</article>
		{/each}
	</div>
</section>

<style>
	.lead {
		margin-top: 0.75rem;
		max-width: 44rem;
	}

	.portals {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1rem;
	}

	.portal {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.5rem;
		background-color: #ffffff;
		border-radius: var(--espoo-radius-lg);
		border: 2px solid var(--espoo-border);
	}

	h2 {
		color: var(--espoo-apricot);
	}

	ul {
		display: grid;
		gap: 0.4rem;
		margin: 0 0 0.75rem;
		padding-left: 1.1rem;
	}

	.open {
		margin-top: auto;
		align-self: start;
		padding: 0.6rem 1.1rem;
		border-radius: var(--espoo-radius);
		background-color: var(--espoo-blue);
		color: var(--espoo-on-blue);
		font-family: var(--espoo-font-heading);
		font-weight: 700;
		text-decoration: none;
	}

	.open:hover {
		background-color: #00245a;
	}
</style>
