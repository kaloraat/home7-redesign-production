"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  pendingChildren?: React.ReactNode;
  className?: string;
}

/**
 * Drop-in replacement for a plain `<button type="submit">` inside a
 * `<form action={someServerAction}>` — `useFormStatus` reads the pending
 * state of the nearest enclosing form, so this works without converting
 * that form itself into a client component. Disables the button and shows
 * a spinner + pendingChildren text while the action is in flight, so a
 * multi-second server action (e.g. one that awaits sending an email) can't
 * be double-submitted by an impatient click.
 */
export function SubmitButton({ children, pendingChildren, className }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "inline-flex items-center gap-2 bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold transition hover:brightness-95 active:brightness-90 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      }
    >
      {pending && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
        </svg>
      )}
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}

export default SubmitButton;
