<script>
	import { onMount } from 'svelte';
	import '../lib/espoo/tokens.css';
	import { EspooFooter, EspooHeader } from '../lib/espoo/index.js';
	import ExamRoom from '../lib/ExamRoom.svelte';
	import Intro from '../lib/Intro.svelte';
	import Platform from '../lib/Platform.svelte';
	import Reviews from '../lib/Reviews.svelte';
	import { api } from '../lib/api.js';
	import { FALLBACK_ROLES } from '../lib/samples.js';

	/** Four screens, chosen by the address: `#/` the intro, `#exam-room` the skill check, `#review/<id?>` the results, `#platform` the full platform. */
	function parseRoute(hash) {
		const [page, id = ''] = hash.replace(/^#\/?/, '').split('/');
		if (page === 'review') return { page: 'review', id };
		if (page === 'exam-room') return { page: 'exam-room', id: '' };
		if (page === 'platform') return { page: 'platform', id: '' };
		return { page: 'intro', id: '' };
	}

	let route = $state(parseRoute(location.hash));
	let roles = $state(FALLBACK_ROLES);

	const links = $derived([
		{ label: 'How it works', href: '#/', active: route.page === 'intro' },
		{ label: 'EXAM room', href: '#exam-room', active: route.page === 'exam-room' },
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
	<title>SkillCheck · City of Espoo</title>
</svelte:head>

<div class="app">
	<EspooHeader {links} />
	<main>
		<!-- Kept mounted so an interview survives a look at the reports. -->
		{#if route.page === 'intro'}
			<Intro />
		{:else if route.page === 'platform'}
			<Platform />
		{/if}
		<div hidden={route.page !== 'exam-room'}>
			<ExamRoom {roles} onaddrole={(role) => (roles = [...roles, role])} />
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
