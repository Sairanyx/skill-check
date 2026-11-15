<script>
	import { onMount } from 'svelte';
	import '../lib/espoo/tokens.css';
	import { EspooFooter, EspooHeader } from '../lib/espoo/index.js';
	import Booth from '../lib/Booth.svelte';
	import Reviews from '../lib/Reviews.svelte';
	import { api } from '../lib/api.js';
	import { FALLBACK_ROLES } from '../lib/samples.js';

	/** Two screens, chosen by the address: `#/` is the booth, `#review/<id?>` the reports. */
	function parseRoute(hash) {
		const [page, id = ''] = hash.replace(/^#\/?/, '').split('/');
		return page === 'review' ? { page: 'review', id } : { page: 'booth', id: '' };
	}

	let route = $state(parseRoute(location.hash));
	let roles = $state(FALLBACK_ROLES);

	const links = $derived([
		{ label: 'Interview', href: '#/', active: route.page === 'booth' },
		{ label: 'Reports', href: '#review', active: route.page === 'review' }
	]);

	onMount(() => {
		api
			.roles()
			.then((list) => list.length && (roles = list))
			.catch(() => {}); // keep the built-in roles

		const onHashChange = () => {
			const next = parseRoute(location.hash);
			if (next.page !== route.page) scrollTo(0, 0);
			route = next;
		};
		addEventListener('hashchange', onHashChange);
		return () => removeEventListener('hashchange', onHashChange);
	});
</script>

<svelte:head>
	<title>SkillCheck Booth · City of Espoo</title>
</svelte:head>

<div class="app">
	<EspooHeader subtitle="SkillCheck Booth" {links} />
	<main>
		<!-- Kept mounted so an interview survives a look at the reports. -->
		<div hidden={route.page !== 'booth'}>
			<Booth {roles} onaddrole={(role) => (roles = [...roles, role])} />
		</div>
		{#if route.page === 'review'}
			<Reviews {roles} selectedId={route.id} />
		{/if}
	</main>
	<EspooFooter />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
