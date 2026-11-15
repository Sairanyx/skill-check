import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// A static single-page app: the Rust server serves ./build as ./public and
			// falls back to index.html for every route.
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	server: {
		port: 5180,
		strictPort: true,
		// The API lives on the Rust server (run.py dev starts both).
		proxy: { '/api': 'http://127.0.0.1:8020' }
	}
});
