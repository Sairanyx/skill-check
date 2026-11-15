import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { currentUser } from "@/lib/session";

/**
 * No home page on the platform: the story lives in the demo front end.
 * Logged-in people go to their own portal, everyone else to the login page.
 */
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const u = await currentUser();
  redirect(u ? `/${lang}/${u.role}` : `/${lang}/login`);
}
