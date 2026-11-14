/** SkillCheck logo: speech bubble with a checkmark ("a conversation that verifies skills") + wordmark. */
export function LogoIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path d="M7 3h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H15.5L9 30v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="#003580" />
      <path d="M10 14.5l4.2 4.2L22.5 10.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const icon = { sm: "size-6", md: "size-7", lg: "size-12" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-4xl" }[size];
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoIcon className={icon} />
      <span className={text}>
        <span className="text-foreground">Skill</span>
        <span className="text-primary">Check</span>
      </span>
    </span>
  );
}
