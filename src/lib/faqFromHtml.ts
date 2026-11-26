/**
 * Builds FAQPage JSON-LD from a post's own visible FAQ section, so content
 * editors only write the questions once (as normal headings in the post)
 * and the markup can never drift from what the page actually shows.
 *
 * Looks for an <h2> whose text contains "frequently asked", "FAQ" or
 * "common questions", then pairs each following <h3>/<h4> (the question)
 * with the paragraphs/lists after it (the answer), stopping at the next
 * <h2>. Returns null unless at least two complete Q&As are found.
 *
 * FAQPage rich results are limited to government/health sites since 2023,
 * so this is for machine understanding (Google, Bing, AI answer engines),
 * not for a SERP feature.
 */
function textOf(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function faqJsonLdFromHtml(html: string) {
  const heading = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let start = -1;
  for (let m; (m = heading.exec(html)); ) {
    if (/frequently asked|\bfaqs?\b|common questions/i.test(textOf(m[1]))) {
      start = m.index + m[0].length;
      break;
    }
  }
  if (start < 0) return null;

  const rest = html.slice(start);
  const nextH2 = rest.search(/<h2[\s>]/i);
  const section = nextH2 >= 0 ? rest.slice(0, nextH2) : rest;

  const parts = section.split(/(<h[34][^>]*>[\s\S]*?<\/h[34]>)/i);
  const items: { q: string; a: string }[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const q = textOf(parts[i]);
    const a = textOf(parts[i + 1] ?? "");
    if (q && a) items.push({ q, a });
  }
  if (items.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
