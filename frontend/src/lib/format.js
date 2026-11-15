/** Labels and colour tones shared by the booth and the report screens. */

export const LANGUAGES = [
	{ value: 'en', label: 'English' },
	{ value: 'fi', label: 'Suomi' },
	{ value: 'sv', label: 'Svenska' }
];

/** How the panel classified a candidate turn (`kind` in the transcript, `reads_last_message_as` in memos). */
const KINDS = {
	answer: { label: 'Answer', tone: 'outline' },
	clarifying: { label: 'Clarifying question', tone: 'apricot' },
	off_track: { label: 'Off track', tone: 'alert' }
};

export const kindOf = (kind) => KINDS[kind];

/** A spread at or above this many points means the panelists disagreed enough to look closer. */
export const SPLIT_PANEL = 2;

/** @param {number} score 0–10 */
export const scoreTone = (score) => (score >= 7.5 ? 'apricot' : score >= 5.5 ? 'outline' : 'alert');

/** Interview statuses other than `done`, which shows the score instead. */
export const STATUS_LABELS = {
	active: 'In progress',
	reporting: 'Writing report',
	failed: 'Report failed'
};

export const verdictLabel = (isGood) => (isGood ? 'Meet this candidate' : 'Not yet');

export const formatDate = (seconds) =>
	new Date(seconds * 1000).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** Roles added on the spot may be missing from an old list; fall back to the id. */
export const findRole = (roles, id) => roles.find((r) => r.id === id) ?? { id, title: id, company: '' };

export const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;
