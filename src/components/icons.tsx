// Small solid/filled contact + social icons shared between SiteNav and the
// footer. Filled rather than thin-stroke outlines — a 1.5–1.6px stroke on
// an icon this small reads as a faint smudge; a filled shape stays crisp.

type IconProps = { className?: string; size?: number };

export function PhoneIcon({ className = "shrink-0", size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.02l-2.2 2.19Z" />
    </svg>
  );
}

export function MobileIcon({ className = "shrink-0", size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 2A2.5 2.5 0 0 0 5 4.5v15A2.5 2.5 0 0 0 7.5 22h9a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 16.5 2h-9ZM12 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

export function PinIcon({ className = "shrink-0", size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58 2 4 5.58 4 10c0 6 8 12 8 12s8-6 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  );
}

export function EmailIcon({ className = "shrink-0", size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2.2.5 6.8 5.44L18.8 6H5.2ZM19 8.1l-6.38 5.1a1 1 0 0 1-1.24 0L5 8.1V18h14V8.1Z" />
    </svg>
  );
}

export function PlayIcon({ className = "shrink-0", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function ChatIcon({ className = "shrink-0", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.3A1 1 0 0 1 3 19.5V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function CloseIcon({ className = "shrink-0", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ className = "shrink-0", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="m12 2.5 2.9 6.28 6.85.72-5.1 4.72 1.42 6.78L12 17.9l-6.07 3.1 1.42-6.78-5.1-4.72 6.85-.72Z" />
    </svg>
  );
}

export function FacebookIcon({ className = "shrink-0", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function LinkedInIcon({ className = "shrink-0", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.2 8.75h3.5V21H3.2V8.75Zm6.2 0h3.36v1.68h.05c.47-.88 1.6-1.8 3.3-1.8 3.53 0 4.18 2.3 4.18 5.3V21h-3.5v-5.4c0-1.29-.02-2.94-1.8-2.94-1.8 0-2.08 1.4-2.08 2.85V21H9.4V8.75Z" />
    </svg>
  );
}

// SiteNav's admin quick-access nub — a standard filled gear/settings glyph.
export function GearIcon({ className = "shrink-0", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM10.5 2a1 1 0 0 0-.98.8l-.35 1.69a7.99 7.99 0 0 0-1.72.71L5.9 4.2a1 1 0 0 0-1.27.12L3.32 5.63a1 1 0 0 0-.12 1.27L4.2 8.45a7.99 7.99 0 0 0-.71 1.72l-1.69.35A1 1 0 0 0 1 11.5v2c0 .48.34.9.8.98l1.69.35c.17.6.4 1.18.71 1.72L3.2 18.1a1 1 0 0 0 .12 1.27l1.31 1.31a1 1 0 0 0 1.27.12l1.55-1.01c.54.31 1.12.54 1.72.71l.35 1.69c.09.46.5.8.98.8h2a1 1 0 0 0 .98-.8l.35-1.69a7.99 7.99 0 0 0 1.72-.71l1.55 1.01a1 1 0 0 0 1.27-.12l1.31-1.31a1 1 0 0 0 .12-1.27l-1.01-1.55c.31-.54.54-1.12.71-1.72l1.69-.35a1 1 0 0 0 .8-.98v-2a1 1 0 0 0-.8-.98l-1.69-.35a7.99 7.99 0 0 0-.71-1.72l1.01-1.55a1 1 0 0 0-.12-1.27l-1.31-1.31a1 1 0 0 0-1.27-.12l-1.55 1.01a7.99 7.99 0 0 0-1.72-.71L13.48 2.8a1 1 0 0 0-.98-.8h-2Z"
      />
    </svg>
  );
}
