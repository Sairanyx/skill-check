import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist_Mono, Lato, Work_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import "../globals.css";

// Same type as espoo.fi: Lato for headings, Work Sans for text.
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.title, description: dict.meta.description };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={`${lato.variable} ${workSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <TooltipProvider>
          <SiteHeader lang={lang} nav={dict.nav} />
          <main className="flex-1">{children}</main>
          <SiteFooter lang={lang} dict={dict} />
          <Toaster />
          {/* Local dev only: hide the Next.js overlay badges so screen recordings stay clean. Errors still print in the terminal and the console. */}
          {process.env.NODE_ENV === "development" && <style>{"nextjs-portal{display:none!important}"}</style>}
        </TooltipProvider>
      </body>
    </html>
  );
}
