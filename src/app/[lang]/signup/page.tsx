import { AuthForm } from "@/components/site/auth-form";

export default async function Page({ params, searchParams }: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  const as = (await searchParams).as;
  const role = as === "company" || as === "city" ? as : "candidate";
  return <AuthForm mode="signup" lang={lang} role={role} />;
}
