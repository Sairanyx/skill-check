import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { PageTitle } from "@/components/app/ui";
import { DemoKiosk } from "@/components/app/demo-kiosk";

/** DEMO ONLY: one click from a booking to the kiosk, for testers and judges. */
export default async function DemoPage({ params }: PageProps<"/[lang]/demo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle kicker="Demo" title="Try a skill check">
        In real life the check only runs on a City computer in a testing room, set up by City staff. This page does those steps for you in this browser. The demo passwords are in the submission.
      </PageTitle>
      <DemoKiosk lang={lang} />
    </div>
  );
}
