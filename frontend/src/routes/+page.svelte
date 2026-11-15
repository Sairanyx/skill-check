<script>
	import { onMount } from 'svelte';
	import '../lib/espoo/tokens.css';
	import { EspooFooter, EspooHeader } from '../lib/espoo/index.js';
	import Booth from '../lib/Booth.svelte';
	import Demo from '../lib/Demo.svelte';
	import Platform from '../lib/Platform.svelte';
	import Reviews from '../lib/Reviews.svelte';
	import { api } from '../lib/api.js';
	import { FALLBACK_ROLES } from '../lib/samples.js';

	/** Four screens, chosen by the address: `#/` booth, `#demo` walkthrough, `#review` results, `#platform` portals. */
	function parseRoute(hash) {
		const [page, id = ''] = hash.replace(/^#\/?/, '').split('/');
		if (page === 'review') return { page: 'review', id };
		if (page === 'demo') return { page: 'demo', id: '' };
		if (page === 'platform') return { page: 'platform', id: '' };
		return { page: 'booth', id: '' };
	}

	let route = $state(parseRoute(location.hash));
	let roles = $state(FALLBACK_ROLES);

	const links = $derived([
		{ label: 'Interview', href: '#/', active: route.page === 'booth' },
		{ label: 'Demo', href: '#demo', active: route.page === 'demo' },
		{ label: 'Results', href: '#review', active: route.page === 'review' },
		{ label: 'Platform', href: '#platform', active: route.page === 'platform' }
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
	<title>SkillCheck EXAM · City of Espoo</title>
</svelte:head>

<div class="app">
	<EspooHeader subtitle="SkillCheck EXAM" {links} />
	<main>
		<!-- Kept mounted so an interview survives a look at the other tabs. -->
		<div hidden={route.page !== 'booth'}>
			<Booth {roles} onaddrole={(role) => (roles = [...roles, role])} />
		</div>
		{#if route.page === 'demo'}
			<Demo />
		{:else if route.page === 'review'}
			<Reviews {roles} selectedId={route.id} />
		{:else if route.page === 'platform'}
			<Platform />
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
