import { redirect } from "next/navigation";

/** The old guided tour moved to /demo. Kept so shared links still work. */
export default async function TourPage({ params }: PageProps<"/[lang]/tour">) {
  const { lang } = await params;
  redirect(`/${lang}/demo`);
}
