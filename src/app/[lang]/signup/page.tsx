import { AuthForm } from "@/components/site/auth-form";

export default async function Page({ params }: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  return <AuthForm mode="signup" lang={lang} />;
}
