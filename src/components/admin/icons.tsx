// Admin-only nav icons — kept separate from the public site's icons.tsx
// (src/components/icons.tsx) since these have no reason to ever be bundled
// into public pages. Same visual language as that file (filled shapes,
// viewBox 24x24, fill="currentColor") for consistency.

type IconProps = { className?: string; size?: number };

export function DashboardIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4Zm0 7h7v9h-7v-9ZM4 14h7v6H4v-6Z" />
    </svg>
  );
}

export function BuildingIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5v-3.5a2 2 0 1 1 4 0V21h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5Zm2 3.5A.5.5 0 0 1 7.5 6h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2Zm7-.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2ZM7 12.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2Zm7.5-.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2Z" />
    </svg>
  );
}

export function UsersIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.31 0-8 1.66-8 5v2h16v-2c0-3.34-4.69-5-8-5Zm7.5-2a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0-1.53.35c.65.98 1.03 2.16 1.03 3.65 0 1.31-.3 2.42-.83 3.32.42.11.87.18 1.33.18Zm.7 2.03c1.63.68 2.8 1.87 2.8 3.47v2H23v-2c0-1.98-2.16-3.09-5.8-3.47Z" />
    </svg>
  );
}

export function DocumentIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7H6Zm7 1.5V8a1 1 0 0 0 1 1h4.5L13 3.5ZM8 13a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H8Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H8Z" />
    </svg>
  );
}

export function InboxIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.34 3A2 2 0 0 0 3.5 4.24L2.06 8.1A2 2 0 0 0 2 8.79V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.79a2 2 0 0 0-.06-.69l-1.44-3.86A2 2 0 0 0 18.66 3H5.34ZM4 9l1.34-4h13.32L20 9h-4.28a1 1 0 0 0-.9.56L14 12h-4l-.82-2.44A1 1 0 0 0 8.28 9H4Zm0 2h3.6l.82 2.44A1 1 0 0 0 9.32 14h5.36a1 1 0 0 0 .9-.56L16.4 11H20v8H4v-8Z" />
    </svg>
  );
}

export function ClipboardCheckIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M9 2a1 1 0 0 0-1 1v1H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V3a1 1 0 0 0-1-1H9Zm0 3V4h6v2H9ZM6 8h12v12H6V8Zm10.7 2.7a1 1 0 0 0-1.4-1.4L11 13.59l-1.3-1.3a1 1 0 0 0-1.4 1.42l2 2a1 1 0 0 0 1.4 0l5-5Z" />
    </svg>
  );
}

export function LinkIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10.5 13.5a1 1 0 0 1 0-1.41l3.09-3.1a3 3 0 0 1 4.24 4.25l-1.59 1.58a1 1 0 0 1-1.41-1.41l1.59-1.59a1 1 0 0 0-1.42-1.41l-3.09 3.08a1 1 0 0 1-1.41 0Zm3 3a1 1 0 0 0 0-1.41l3.09-3.09a1 1 0 1 0-1.41-1.41l-3.09 3.08a3 3 0 1 0 4.24 4.25l1.59-1.59a1 1 0 0 0-1.41-1.41l-1.6 1.58a1 1 0 0 0 0 1.42 1 1 0 0 1-1.41 0Zm-8.09-1.09 1.59-1.59a1 1 0 0 0-1.41-1.41L4 14a3 3 0 0 0 4.24 4.24l3.1-3.09a1 1 0 1 0-1.42-1.41l-3.09 3.08a1 1 0 0 1-1.42-1.41Z" />
    </svg>
  );
}

export function UserCogIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-3.65 0-8 1.83-8 5.5V21h11.28a5.98 5.98 0 0 1-.15-3.65A11.4 11.4 0 0 0 10 14Zm9.94 3.5c.03-.16.06-.33.06-.5s-.03-.34-.06-.5l1.08-.85a.25.25 0 0 0 .06-.32l-1.02-1.77a.25.25 0 0 0-.3-.11l-1.28.51c-.27-.2-.55-.38-.87-.5l-.2-1.36a.25.25 0 0 0-.25-.2h-2.04a.25.25 0 0 0-.25.2l-.19 1.36c-.32.13-.61.3-.87.5l-1.28-.51a.25.25 0 0 0-.3.11l-1.02 1.77a.25.25 0 0 0 .06.32l1.08.85a3.9 3.9 0 0 0 0 1l-1.08.85a.25.25 0 0 0-.06.32l1.02 1.77c.06.1.19.15.3.11l1.28-.51c.26.2.55.38.87.5l.19 1.37c.02.12.12.2.25.2h2.04c.13 0 .23-.08.25-.2l.2-1.37c.32-.12.6-.29.87-.5l1.28.51c.11.04.24 0 .3-.11l1.02-1.77a.25.25 0 0 0-.06-.32l-1.08-.85ZM17 19a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
}

export function SignOutIcon({ className = "shrink-0", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 3a1 1 0 0 0 0 2h6v14h-6a1 1 0 1 0 0 2h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-7Zm-.29 5.29a1 1 0 0 0-1.42 1.42L9.59 11H3a1 1 0 1 0 0 2h6.59l-1.3 1.29a1 1 0 0 0 1.42 1.42l3-3a1 1 0 0 0 0-1.42l-3-3Z" />
    </svg>
  );
}

// Sidebar collapse/expand toggle — a "panel with a divider" glyph (outline
// rectangle + a vertical line marking off the nav column, common shorthand
// for "toggle sidebar" in dashboard UIs). Same icon both ways; the caller
// rotates it 180° when expanding vs collapsing rather than swapping to a
// second icon.
export function PanelToggleIcon({ className = "shrink-0", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 9.5 12 12l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
