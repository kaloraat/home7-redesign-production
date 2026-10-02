/** URL slug used for property pages: "2/142 Haldon St" → "2-142-haldon-st". */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
