/**
 * Shared typography for rendering rich text content — used by the
 * RichTextEditor's live editing area AND the public blog/property pages
 * that render the saved HTML. One source of truth so what an admin sees
 * while typing is exactly what a visitor sees once published.
 *
 * Tailwind's preflight strips ALL default browser styling from headings,
 * lists, and blockquotes (font-size/weight reset to inherit, list-style
 * removed, margins zeroed) — so without explicit rules here, a `<h2>` or
 * `<ul>` in the saved HTML renders completely indistinguishable from a
 * plain paragraph. `<strong>`/`<em>` aren't touched by preflight, which is
 * why Bold/Italic "just worked" while every other toolbar button appeared
 * to silently do nothing — the commands were applying correctly all
 * along, there was just no CSS to make the result visible.
 *
 * Selectors use the `>` (direct-child) combinator for block spacing so a
 * paragraph nested inside a list item (TipTap wraps list content as
 * `<li><p>...</p></li>`) or inside a blockquote doesn't ALSO pick up the
 * top-level paragraph's mb-8 — that would stack into a much bigger gap
 * than intended between list items. Only true top-level blocks are
 * spaced; nested ones keep Tailwind's zeroed default margin.
 *
 * No margin-top anywhere, by design — every block gets margin-bottom
 * only, so consecutive blocks read as one predictable, uniform gap
 * regardless of what precedes them.
 */
export const RICH_TEXT_CLASSNAME =
  "text-xl font-medium text-slate-600 leading-[1.85] " +
  "[&>p]:mb-8 " +
  "[&>h1]:mb-6 [&>h1]:font-display [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:leading-tight [&>h1]:text-brand-navy " +
  "[&>h2]:mb-6 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:leading-tight [&>h2]:text-brand-navy " +
  "[&>h3]:mb-4 [&>h3]:font-display [&>h3]:text-xl [&>h3]:font-bold [&>h3]:leading-tight [&>h3]:text-brand-navy " +
  "[&>h4]:mb-4 [&>h4]:font-display [&>h4]:text-xl [&>h4]:font-bold [&>h4]:leading-tight [&>h4]:text-brand-navy " +
  // h5/h6 aren't in the TipTap toolbar (only H2/H3) — these only ever come
  // from the legacy migrated listing copy, which consistently used h5 for
  // a bold "contact the agent" call-out and h6 for a "Disclaimer:" label
  // (see migrate-laravel-data.ts's source content). Real content, not
  // arbitrary — styled to match rather than left to render as invisible
  // plain text the way every other untouched heading level did before.
  "[&>h5]:mb-4 [&>h5]:text-lg [&>h5]:font-bold [&>h5]:text-brand-navy [&>h5]:underline [&>h5]:decoration-brand-gold [&>h5]:decoration-2 [&>h5]:underline-offset-4 " +
  "[&>h6]:mb-2 [&>h6]:text-sm [&>h6]:font-semibold [&>h6]:uppercase [&>h6]:tracking-wide [&>h6]:text-slate-400 " +
  "[&>ul]:mb-8 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 " +
  "[&>ol]:mb-8 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 " +
  "[&>blockquote]:mb-8 [&>blockquote]:border-l-4 [&>blockquote]:border-brand-gold [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-500 " +
  // Tailwind's preflight strips `<hr>`'s default appearance same as every
  // other element here — without this it renders as a near-invisible
  // sliver, not the deliberate section divider a horizontal line is meant
  // to be. `border-none` first cancels preflight's own leftover 1px
  // border-top reset before border-t re-adds a controlled one.
  "[&>hr]:my-8 [&>hr]:border-none [&>hr]:border-t [&>hr]:border-slate-200 " +
  "[&_a]:text-brand-gold-dark [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_strong]:font-semibold [&_strong]:text-slate-800 " +
  "[&_img]:mb-8 [&_img]:rounded-lg";
