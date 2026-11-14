export const locales = ["en", "fi", "sv"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fi: "Suomi",
  sv: "Svenska",
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** English names, used inside AI prompts. */
export const languageNamesEn: Record<Locale, string> = { en: "English", fi: "Finnish", sv: "Swedish" };
