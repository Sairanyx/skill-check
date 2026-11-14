import { AuthForm } from "@/components/site/auth-form";

export default async function Page({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  return <AuthForm mode="login" lang={lang} />;
}
