// Synthetic demo data (no real people or companies). Replaced by the database later.
export type Need = {
  id: string;
  company: string;
  title: string;
  summary: string;
  skills: string[];
  level: "junior" | "mid" | "senior";
  /** Optional company questions per level. Empty = the AI builds easy filter questions itself. */
  questionBank?: { junior?: string[]; mid?: string[]; senior?: string[] } | null;
  companyDescription?: string | null;
  /** BARS anchors per skill (generated once per need). */
  anchors?: { skill: string; anchors: { "1": string; "3": string; "5": string }; checklist: string[] }[] | null;
};

export const DEMO_NEEDS: Need[] = [
  {
    id: "nordic-logistics-data",
    company: "Kauklahti Parcel Oy",
    title: "Data analyst: delivery delays",
    summary:
      "Our delivery data is messy: duplicate scans, missing timestamps, three different depot systems. " +
      "We need someone who can clean it, find why deliveries are late and explain it to non-technical managers.",
    skills: ["data cleaning", "SQL", "Python or Excel", "root-cause analysis", "explaining results"],
    level: "mid",
  },
  {
    id: "espoo-cloud-platform",
    company: "Tapiola Cloud Oy",
    title: "Cloud engineer: cost control",
    summary:
      "Our cloud bill grew 40% in a year. We need someone who can find the waste, automate scaling " +
      "and keep services reliable while costs go down.",
    skills: ["Kubernetes", "cloud cost optimisation", "monitoring", "automation", "trade-off reasoning"],
    level: "mid",
  },
];

export const getNeed = (id: string) => DEMO_NEEDS.find((n) => n.id === id);
