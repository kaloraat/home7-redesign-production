import { Schema, models, model, type Document, type Model } from "mongoose";

/**
 * Unified content model for blog posts (/blog/[slug]), the site's
 * root-level SEO landing pages (/[slug] — see the URL inventory notes: the
 * live site has a large number of local-SEO pages with no /blog/ prefix),
 * and suburb landing pages (/suburb/[slug] — PROJECT_BRIEF.md Phase 4, the
 * site's core local-SEO play: one page per target suburb combining
 * genuinely local content with that suburb's current listings, rather than
 * competing with realestate.com.au on generic search terms). `urlPath`
 * decides which route renders it.
 *
 * Uniqueness is (slug, urlPath), not slug alone: the old Laravel site has a
 * confirmed handful of articles that live at both /blog/{slug} and bare
 * /{slug} with separate DB rows (`blogs` vs `other_blogs` tables) — e.g.
 * real-estate-in-liverpool, real-estate-agent-liverpool-nsw. Both URLs are
 * live today, so both get imported rather than picking a canonical and
 * breaking the other (see PROJECT_BRIEF.md: zero broken links).
 */
export interface IContent extends Document {
  slug: string;
  urlPath: "blog" | "root" | "suburb";
  title: string;
  excerpt?: string;
  bodyHtml: string;
  coverImage?: string;
  status: "draft" | "published";
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  // For urlPath "suburb", this is the page's actual identity — must match
  // a TARGET_SUBURBS entry exactly (src/lib/constants.ts), since it's used
  // to query live Property listings for that suburb. For a blog/root post
  // it's optional local-SEO tagging only, unrelated to routing.
  targetSuburb?: string;
  source: "manual" | "ai";
  aiReviewed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    slug: { type: String, required: true, index: true },
    urlPath: { type: String, enum: ["blog", "root", "suburb"], required: true, index: true },
    title: { type: String, required: true },
    excerpt: String,
    bodyHtml: { type: String, required: true },
    coverImage: String,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: Date,
    seoTitle: String,
    seoDescription: String,
    targetSuburb: String,
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
    aiReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound uniqueness — see class comment above for why slug alone isn't unique.
ContentSchema.index({ slug: 1, urlPath: 1 }, { unique: true });

export const Content: Model<IContent> =
  models.Content || model<IContent>("Content", ContentSchema);

export default Content;
