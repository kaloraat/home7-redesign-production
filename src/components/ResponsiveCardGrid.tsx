import type { ReactNode } from "react";

/**
 * 3-column max by default, at Tailwind's standard sm(640)/lg(1024)
 * breakpoints — deliberately matching WhyHome7's own grid-cols-1/
 * sm:grid-cols-2/lg:grid-cols-3 rather than inventing custom breakpoints,
 * since that section was called out as already getting card width right at
 * every tier. Columns are fluid (equal fr shares), so cards fill the full
 * row width at every tier — no fixed pixel widths.
 *
 * `wide4up` opts a grid into a 4th column at the 2xl breakpoint (1536px) —
 * for property/blog cards on very wide screens, on the condition that it
 * never makes a card narrower than the 3-column tier already allows. The
 * math: in this component's actual parents (all `max-w-6xl` containers,
 * `px-4` padding, `gap-6`), the 3-column floor is (1152 - 32 - 48) / 3 =
 * 357.33px/card. For 4 columns to match that floor: containerWidth =
 * 4×357.33 + 3×24(gaps) + 32(padding) = 1533.33px — i.e. right around the
 * 2xl breakpoint itself, which is why the parent container's own max-width
 * has to grow to `2xl:max-w-384` (1536px) in lockstep with this (see
 * page.tsx) — at 1536px that gives 358px/card, marginally *wider*
 * than the 3-column floor, never narrower. Not applied to testimonials:
 * with exactly 6 items, a 4-column tier would trim to 4 (floor(6/4)*4),
 * showing *fewer* cards at a wider viewport than the 3-column tier already
 * shows (all 6) — a regression `keepCount` below can't avoid without
 * reintroducing the orphaned-partial-row problem it exists to prevent.
 *
 * At each active tier, only as many items as fill complete rows are shown —
 * a partial last row (e.g. 8 items across 3 columns strands 2 alone on a
 * second row) is trimmed rather than left wrapping awkwardly. This is
 * computed from the actual item count, not hardcoded for one particular
 * count — an earlier version assumed exactly 4 items (its original use
 * case: property/blog listings) and silently capped every grid at 4 items
 * regardless of how many were passed in, which broke the first time this
 * component was reused with 8 testimonials.
 */
const COLUMNS_AT_TIER_3 = [1, 2, 3] as const;
const COLUMNS_AT_TIER_4 = [1, 2, 3, 4] as const;

const COLUMN_CLASSES_3 = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
const COLUMN_CLASSES_4 = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

// Every literal class name this component can emit, spelled out in full.
// Tailwind's build-time scanner only generates CSS for class names that
// appear as complete literal text somewhere in the source — a name built
// via string concatenation (e.g. a template literal combining a variable
// prefix with "block") is invisible to that scan and silently produces no
// CSS at all. Indexing into these pre-written literals at runtime is fine;
// assembling the strings at runtime is not — that's exactly what broke
// silently the first time this was refactored to be item-count-aware.
const VISIBLE_AT_TIER_3 = ["block", "sm:block", "lg:block"];
const HIDDEN_AT_TIER_3 = ["hidden", "sm:hidden", "lg:hidden"];
const VISIBLE_AT_TIER_4 = ["block", "sm:block", "lg:block", "2xl:block"];
const HIDDEN_AT_TIER_4 = ["hidden", "sm:hidden", "lg:hidden", "2xl:hidden"];

function keepCount(total: number, columns: number): number {
  // A single-column layout never has an orphan-row problem — every item is
  // its own complete row — and any tier with total <= columns fits in one
  // row regardless of the exact count, so nothing needs hiding there either.
  if (columns === 1 || total <= columns) return total;
  return Math.floor(total / columns) * columns;
}

function itemVisibilityClass(index: number, total: number, wide4up: boolean): string {
  const columnsAtTier = wide4up ? COLUMNS_AT_TIER_4 : COLUMNS_AT_TIER_3;
  const visibleAtTier = wide4up ? VISIBLE_AT_TIER_4 : VISIBLE_AT_TIER_3;
  const hiddenAtTier = wide4up ? HIDDEN_AT_TIER_4 : HIDDEN_AT_TIER_3;
  return columnsAtTier
    .map((columns, tier) => {
      const visible = index < keepCount(total, columns);
      return visible ? visibleAtTier[tier] : hiddenAtTier[tier];
    })
    .join(" ");
}

export function ResponsiveCardGrid<T>({
  items,
  renderItem,
  wide4up = false,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  wide4up?: boolean;
}) {
  const columnClasses = wide4up ? COLUMN_CLASSES_4 : COLUMN_CLASSES_3;
  return (
    <div className={`grid gap-6 ${columnClasses}`}>
      {items.map((item, i) => (
        <div key={i} className={itemVisibilityClass(i, items.length, wide4up)}>
          {renderItem(item, i)}
        </div>
      ))}
    </div>
  );
}

export default ResponsiveCardGrid;
