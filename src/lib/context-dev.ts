import "server-only";

/**
 * Context.dev: reads a public web page (company site or job post) and returns it as Markdown.
 * Only public company pages are sent, never anything about jobseekers.
 * Docs: https://docs.context.dev/api-reference/web-scraping/scrape.md
 */
export async function pageAsMarkdown(url: string): Promise<{ title?: string; markdown: string }> {
  const key = process.env.CONTEXT_DEV_API_KEY;
  if (!key) throw new Error("CONTEXT_DEV_API_KEY is not set");
  const res = await fetch("https://api.context.dev/v1/web/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: { markdown: true }, markdownParams: { includeLinks: false }, sharedParams: { mainContentOnly: true }, timeoutOpts: { milliseconds: 30_000, behavior: "return-partial" } }),
    signal: AbortSignal.timeout(40_000),
  });
  if (!res.ok) throw new Error(`Context.dev failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const out = (await res.json()) as { markdown?: { success: boolean; data: string | null }; metadata?: { title?: string } };
  if (!out.markdown?.success || !out.markdown.data) throw new Error("Context.dev could not read that page");
  return { title: out.metadata?.title, markdown: out.markdown.data.slice(0, 12_000) };
}
