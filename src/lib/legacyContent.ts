const HEADING_WEIGHT_RE = /font-weight:\s*(700|800|900|bold)\b/i;

// Vertical rhythm should come entirely from this site's own CSS (one
// uniform margin-bottom on every block-level element — see the
// [&_:is(p,li,h1,...)]:mb-8 rule in blog/[slug]/page.tsx / [slug]/page.tsx),
// never from whatever a Word/Google Docs paste happened to bake into an
// individual element. Previously only p/li had their margin stripped;
// headings kept their own small inline margin (e.g. h2's
// margin-bottom:4pt ≈ 5px) — nowhere near "one line" of space, which is why
// a heading or bold callout could sit almost flush against the next
// paragraph even after the p/li fix. mso-margin-*-alt is Word's own
// non-standard property name; browsers ignore it entirely (it has no
// rendering effect on its own — the real, functional override is always
// the standard margin-* that accompanies it), so stripping it here is just
// HTML cleanliness, not a functional fix. line-height is handled
// separately (see LINE_HEIGHT_STRIPPED_TAGS below) — headings keep their
// own, since it governs in-line wrapping of a multi-line heading, not
// spacing to neighboring elements.
const MARGIN_PROPS = new Set([
  "margin",
  "margin-top",
  "margin-bottom",
  "mso-margin-top-alt",
  "mso-margin-bottom-alt",
]);
const MARGIN_STRIPPED_TAGS = new Set(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"]);
const LINE_HEIGHT_STRIPPED_TAGS = new Set(["p", "li"]);

// A span has to be BOTH bold AND meaningfully larger than this site's own
// body text (18px) to count as a real pseudo-heading. Genuine headings in
// this content run 17–23pt (22.7–30.7px); body text is 11pt (14.7px) — the
// gap is wide enough that 16px (12pt) sits cleanly between the two. Without
// this size check, a *bold-but-body-sized* span (a "key takeaway" callout
// the original doc just bolded, not a heading) was being treated as a
// heading and kept at its native ~15px, rendering visibly *smaller* than
// the plain paragraphs around it once those get normalized to 18px —
// backwards from the intended effect of preserving heading emphasis.
function parseFontSizePx(styleValue: string): number | null {
  const match = styleValue.match(/font-size:\s*([\d.]+)(px|pt)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return match[2].toLowerCase() === "pt" ? value * (4 / 3) : value;
}

/**
 * The blog/other-blog content migrated from the Laravel `blogs`/`other_blogs`
 * tables was pasted in from Word/Google Docs, so almost every run of text
 * arrived wrapped in its own `<span style="...">` carrying an explicit
 * font-size/font-family/color — which, as inline styles, silently override
 * any class-based CSS we apply to the wrapping container. This strips just
 * font-size/color from "plain" spans (not a real bold pseudo-heading, per
 * the size+weight check above) so normal body copy inherits the site's
 * text-lg/slate-600 treatment, while leaving genuine bold pseudo-headings
 * (used throughout this content instead of real <h2>/<h3> tags) at their
 * original size — so the article's visual hierarchy survives. font-family
 * is always stripped so everything inherits the site's own font regardless
 * of weight/size.
 *
 * Separately: individual elements themselves (not just their inner spans)
 * often carry their own inline line-height/margin — e.g. one paragraph with
 * no inline style at all (inherits our leading-[1.85] correctly) sitting
 * right next to one pasted with
 * `style="line-height:1.38;margin-top:12pt;margin-bottom:12pt"` (doesn't).
 * That's what makes spacing look inconsistent within a single article —
 * some elements happen to carry an override, others don't, and even where
 * headings did carry one it was too small to read as real separation.
 * Margin is stripped unconditionally on every block element (p/li/h1–h6) —
 * none of them should dictate their own layout — while line-height is left
 * alone on headings specifically, since it governs in-line wrapping of a
 * multi-line heading, not spacing to neighbors.
 */
function sanitizeStyleAttr(styleValue: string, tag: string): string {
  const sizePx = parseFontSizePx(styleValue);
  const isEmphasized = HEADING_WEIGHT_RE.test(styleValue) && sizePx !== null && sizePx >= 16;
  const tagLower = tag.toLowerCase();
  const stripMargin = MARGIN_STRIPPED_TAGS.has(tagLower);
  const stripLineHeight = LINE_HEIGHT_STRIPPED_TAGS.has(tagLower);
  const kept = styleValue
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      const prop = decl.split(":")[0]?.trim().toLowerCase();
      if (prop === "font-family") return false;
      if (prop === "font-size" && !isEmphasized) return false;
      if (prop === "color" && !isEmphasized) return false;
      if (stripLineHeight && prop === "line-height") return false;
      if (stripMargin && MARGIN_PROPS.has(prop)) return false;
      return true;
    });
  return kept.join("; ");
}

/**
 * The same paste pipeline leaves behind empty "blank line" paragraphs
 * between real ones — `<p><br></p>`, or `<p><b ...><br><br></b></p>` (a
 * Google Docs artifact, its id="docs-internal-guid-..." attribute is a dead
 * giveaway). These represent the author hitting Enter once or twice for
 * visual spacing in the original doc, back when the content had no CSS
 * margin of its own. Now that every real paragraph gets its own mb-5 (see
 * sanitizeStyleAttr above) and every heading keeps its own inline margin,
 * these spacers are redundant — worse, since each one still gets styled
 * with the same line-height and margin as a real paragraph, they stack into
 * noticeably large, inconsistent gaps (worse with two <br>s than one, worse
 * yet if several spacers happen to sit in a row) depending on how many a
 * given post happens to have. Removed entirely rather than restyled, since
 * the spacing they were approximating is already handled by real elements'
 * own margins.
 */
// A paragraph holding only an <img> (or other embedded, non-text content)
// has no text left once tags are stripped below — this used to make
// stripEmptyParagraphs treat `<p><img src="..."></p>` as "empty" and
// delete the whole paragraph, image included. Real bug, not
// hypothetical: confirmed against an actual migrated blog post
// (hidden-costs-buying-property-nsw) whose two inline body images were
// present in bodyHtml but silently vanished by the time the page
// rendered — this function is why. Anything with real visual content
// checked first, before the text-emptiness check ever runs.
function isEffectivelyEmptyParagraph(innerHtml: string): boolean {
  if (/<(img|iframe|video|audio|embed|object)\b/i.test(innerHtml)) return false;
  const withoutBreaks = innerHtml.replace(/<br\s*\/?>/gi, "");
  const withoutTags = withoutBreaks.replace(/<[^>]+>/g, "");
  return withoutTags.replace(/&nbsp;/gi, " ").trim() === "";
}

function stripEmptyParagraphs(html: string): string {
  return html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (match, inner: string) =>
    isEffectivelyEmptyParagraph(inner) ? "" : match
  );
}

// A subtler variant of the same "Enter for spacing" habit: instead of a
// separate empty paragraph, the SAME paragraph as a real heading/callout
// starts with its own throwaway `<br>` — usually wrapped in an empty
// `<b style="font-weight:normal;">` (a Google Docs artifact) — e.g.
// `<p><b style="font-weight:normal;"><br></b><span
// style="...font-weight:700;...">Why Sydney Attracts New Migrants</span>
// <b style="font-weight:normal;"></b></p>`. isEffectivelyEmptyParagraph
// above correctly leaves this alone (the paragraph isn't empty — it has
// real heading text), but the leading <br> still renders as a line break
// *inside* this one paragraph, stacking with the mb-8 gap already sitting
// between it and the previous paragraph — the same "more than one line of
// space" symptom, just from an extra break inside the box rather than a
// whole extra box. Strips only a *leading* run of break-only wrapper tags
// and a *trailing* run of fully-empty ones — never a <br> in the middle of
// real content, which could be an intentional line break (e.g. an address).
function stripStrayLeadingTrailingBreaks(html: string): string {
  return html.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs: string, inner: string) => {
    let cleaned = inner;
    cleaned = cleaned.replace(/^(?:\s*<(b|span|i|u)\b[^>]*>(?:\s*<br\s*\/?>\s*)+<\/\1>\s*)+/i, "");
    cleaned = cleaned.replace(/^(?:\s*<br\s*\/?>\s*)+/i, "");
    cleaned = cleaned.replace(/(?:\s*<(b|span|i|u)\b[^>]*>\s*<\/\1>\s*)+$/i, "");
    return cleaned === inner ? match : `<p${attrs}>${cleaned}</p>`;
  });
}

export function normalizeLegacyHtml(html: string): string {
  const withoutSpacers = stripStrayLeadingTrailingBreaks(stripEmptyParagraphs(html));
  return withoutSpacers.replace(
    /<(\w+)([^>]*?)\sstyle="([^"]*)"/g,
    (match, tag: string, before: string, styleValue: string) => {
      const cleaned = sanitizeStyleAttr(styleValue, tag);
      return cleaned ? `<${tag}${before} style="${cleaned}"` : `<${tag}${before}`;
    }
  );
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

/**
 * Strips all tags and decodes entities, collapsing whitespace — for
 * anywhere rich-text HTML (a property/post body) needs to become plain
 * text, most importantly a `<meta name="description">` fallback. Slicing
 * raw HTML directly (as property/[slug]'s generateMetadata used to) can
 * put a literal `<p>`/`<strong>` fragment into the meta tag's visible
 * text if the cut lands mid-tag — this guarantees real, tag-free text.
 */
export function htmlToPlainText(html: string, maxLength?: number): string {
  const text = decodeHtmlEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (!maxLength || text.length <= maxLength) return text;
  // Trim to the last whole word within the limit rather than cutting
  // mid-word.
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

/**
 * Some legacy posts repeat the title as their own leading heading/paragraph
 * inside bodyHtml (on top of the <h1> the page already renders separately),
 * so it visibly shows twice. Strips a single leading element if its
 * tag-stripped text exactly matches the title (case/whitespace-insensitive)
 * — conservative on purpose: only ever removes an exact match, so posts
 * that don't have the duplicate are untouched.
 *
 * HTML entities in the extracted text (e.g. bodyHtml's "&amp;" for a title
 * containing a literal "&") are decoded before comparing — missed initially,
 * which meant any title containing a character HTML has to escape never
 * matched and its duplicate heading silently survived.
 */
export function stripDuplicateTitle(html: string, title: string): string {
  const trimmedTitle = title.trim().toLowerCase().replace(/\s+/g, " ");
  const match = html.match(/^\s*<(\w+)[^>]*>([\s\S]*?)<\/\1>/);
  if (!match) return html;
  const innerText = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, ""))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (innerText === trimmedTitle) {
    return html.slice(match[0].length).trimStart();
  }
  return html;
}
