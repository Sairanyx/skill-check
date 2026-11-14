import { notFound } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getDictionary } from "@/i18n/get-dictionary";

// Skeleton: real data arrives once the database is connected (SPEC.md §2).
export default async function Page({ params }: PageProps<"/[lang]/city">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "city");
  const t = (await getDictionary(lang)).dashboard.city;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">{t.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.empty}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
