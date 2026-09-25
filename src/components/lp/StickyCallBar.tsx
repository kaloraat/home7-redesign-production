"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/lp/site";
import { gtag, trackPhoneClick } from "@/lib/lp/tracking";
import { PhoneIcon } from "@/components/icons";
import { useLp } from "./LpContext";

/**
 * Mobile-only bottom bar. Appears once the hero form has scrolled out of
 * view, hides while a form field is focused (so it never covers the
 * keyboard) and while either form is on screen (so it never covers a form).
 */
export function StickyCallBar() {
  const { leadType, region } = useLp();
  const [pastHero, setPastHero] = useState(false);
  const [formOnScreen, setFormOnScreen] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const forms = Array.from(document.querySelectorAll<HTMLElement>("[data-lp-form]"));
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
        if (e.target.getAttribute("data-lp-form") === "hero") {
          setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0);
        }
      }
      setFormOnScreen(visible.size > 0);
    });
    forms.forEach((f) => io.observe(f));

    const isField = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const onIn = (e: FocusEvent) => isField(e.target) && setTyping(true);
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      io.disconnect();
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  const show = pastHero && !formOnScreen && !typing;

  function goToForm() {
    gtag("event", "sticky_cta_click", { lead_type: leadType, region });
    const first = document.querySelector<HTMLInputElement>('[data-lp-form="hero"] input[name="name"]');
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Focus after the scroll so iOS doesn't jump twice.
    setTimeout(() => first?.focus({ preventScroll: true }), 450);
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] transition-transform duration-200 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
      // Off-screen but not display:none so the number stays in the DOM text.
      aria-hidden={!show}
    >
      <a
        href={SITE.phoneHref}
        tabIndex={show ? 0 : -1}
        onClick={() => trackPhoneClick("sticky", leadType, region)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand-navy bg-white px-3 text-base font-bold text-brand-navy"
      >
        <PhoneIcon size={18} />
        <span>Call now</span>
      </a>
      <button
        type="button"
        tabIndex={show ? 0 : -1}
        onClick={goToForm}
        className="min-h-12 rounded-xl border-2 border-brand-gold-dark bg-brand-gold px-3 text-base font-bold text-brand-navy"
      >
        Free appraisal
      </button>
    </div>
  );
}

export default StickyCallBar;
