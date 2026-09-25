"use client";

import { SWITCH_CHIP } from "@/lib/lp/content";

/** Scrolls to the hero form, pre-selects the "switch" chip and focuses Name. */
export function goToSwitchForm() {
  const form = document.querySelector<HTMLFormElement>('[data-lp-form="hero"]');
  if (!form) return;
  const chip = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="choice"]')).find((i) => i.value === SWITCH_CHIP);
  if (chip) chip.checked = true;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  const name = form.querySelector<HTMLInputElement>('input[name="name"]');
  // Focus after the scroll so iOS doesn't jump twice.
  setTimeout(() => name?.focus({ preventScroll: true }), 450);
}

export function SwitchButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={goToSwitchForm} className={className}>
      {children}
    </button>
  );
}

export function SwitchBanner() {
  return (
    <button
      type="button"
      onClick={goToSwitchForm}
      className="block w-full bg-brand-gold/25 px-4 py-3 text-center text-base font-semibold text-brand-navy hover:bg-brand-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-navy"
    >
      Unhappy with your current agent? Just say yes and we handle the switch. <span aria-hidden="true">→</span>
    </button>
  );
}
