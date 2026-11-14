/**
 * Our own form messages instead of the browser's grey pop-ups. Use with <form noValidate>.
 * Returns the first problem as a short sentence, or null when the form is fine.
 */
export function formProblem(form: HTMLFormElement): string | null {
  for (const el of Array.from(form.elements) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[]) {
    if (!("validity" in el) || el.validity.valid || el.type === "hidden") continue;
    const label = (el.id && form.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()) || el.getAttribute("aria-label") || "This field";
    const v = el.validity;
    if (v.valueMissing) return `${label}: please fill this in.`;
    if (v.tooShort && "minLength" in el) return `${label}: at least ${el.minLength} characters.`;
    if (v.typeMismatch && el.type === "email") return `${label}: please enter a valid email address.`;
    if (v.typeMismatch && el.type === "url") return `${label}: please paste a full web address, starting with https://`;
    return `${label}: please check this.`;
  }
  return null;
}
