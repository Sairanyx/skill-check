import { AuthForm } from "@/components/site/auth-form";

export default async function Page({ params, searchParams }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  const as = (await searchParams).as;
  const role = as === "company" || as === "city" ? as : "candidate";
  return <AuthForm mode="login" lang={lang} role={role} />;
}
