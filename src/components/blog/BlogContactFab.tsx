"use client";

import { useEffect, useRef, useState } from "react";
import { ChatIcon, CloseIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import { BLOG_CONTACT_FORM_HEADING, BLOG_CONTACT_FORM_INTRO } from "@/lib/constants";

/**
 * Mobile-only floating "contact" button (the sticky sidebar in
 * blog/[slug]/page.tsx handles this on desktop instead). Opens the same
 * ContactForm — shared with /contact — in a modal. Hides itself once
 * `endOfArticleId` scrolls into view, since the article
 * already ends with its own copy of the form at that point (see
 * blog/[slug]/page.tsx) — no need for the floating shortcut once the reader
 * has scrolled past the content to the form itself.
 */
export function BlogContactFab({
  postTitle,
  endOfArticleId,
}: {
  postTitle: string;
  endOfArticleId: string;
}) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById(endOfArticleId);
    if (!target) return;

    // A one-way latch, not a live toggle: once the reader has reached the
    // inline form, hide the FAB for good and stop observing. A live toggle
    // (visible = !isIntersecting) looked right at first but breaks the
    // moment the reader scrolls past the form into the footer — the form
    // leaves the viewport again, isIntersecting flips back to false, and the
    // FAB reappears floating over the footer.
    //
    // isIntersecting alone also isn't enough on its own: a large instant
    // jump (End key, scrollbar drag-to-bottom, a "jump to bottom" link) can
    // skip a short sentinel's visible window between observer callbacks
    // entirely, so isIntersecting never reports true even though the reader
    // is now past it. boundingClientRect.bottom <= 0 catches that case too —
    // it's true once the sentinel is above the viewport, regardless of
    // whether an intersecting frame was ever observed along the way.
    const observer = new IntersectionObserver(([entry]) => {
      const alreadyPassed = entry.boundingClientRect.bottom <= 0;
      if (entry.isIntersecting || alreadyPassed) {
        setVisible(false);
        observer.disconnect();
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [endOfArticleId]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  return (
    <div className="lg:hidden">
      {visible && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Contact a local agent"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-lg cursor-pointer"
        >
          <ChatIcon size={24} />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative w-full max-w-sm p-4 outline-none"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-1 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-navy shadow-lg cursor-pointer"
            >
              <CloseIcon size={16} />
            </button>
            <div className="rounded-lg border border-slate-200 bg-white p-5 max-h-[85vh] overflow-y-auto">
              <ContactForm
                leadType="blog"
                heading={BLOG_CONTACT_FORM_HEADING}
                intro={BLOG_CONTACT_FORM_INTRO}
                fallbackMessage={`Reader enquiry from blog post: ${postTitle}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogContactFab;
