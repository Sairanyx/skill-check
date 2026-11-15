/** Thin client for the Rust server (see SERVER_API.md). Every call throws `Error(message)` on failure. */

async function request(path, { method = 'GET', body } = {}) {
	const res = await fetch(`/api${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined
	});
	const data = await res.json().catch(() => null); // 202 replies have no body
	if (!res.ok) throw new Error(data?.error ?? `The server answered ${res.status}.`);
	return data;
}

const post = (path, body) => request(path, { method: 'POST', body });

export const api = {
	roles: () => request('/roles'),
	createRole: (role) => post('/roles', role),
	startInterview: (roleId, language) => post('/interviews', { role_id: roleId, language }),
	sendMessage: (id, text) => post(`/interviews/${id}/messages`, { text }),
	finishInterview: (id) => post(`/interviews/${id}/finish`),
	candidateView: (id) => request(`/interviews/${id}`),
	reviews: () => request('/review'),
	review: (id) => request(`/review/${id}`),
	retryReport: (id) => post(`/review/${id}/report`)
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls `load` every few seconds while the interview is still `reporting`,
 * and resolves with the first result that isn't. Stops quietly when `signal` aborts.
 * @template {{ status: string }} T
 * @param {() => Promise<T>} load
 * @param {AbortSignal} signal
 * @returns {Promise<T | undefined>}
 */
export async function waitForReport(load, signal) {
	while (!signal.aborted) {
		await sleep(3000);
		if (signal.aborted) return;
		const data = await load().catch(() => null);
		if (data && data.status !== 'reporting') return data;
	}
}
