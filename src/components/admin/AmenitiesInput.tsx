"use client";

import { useRef, useState } from "react";

// The most-used feature tags across this business's own 152 real listings
// (counted directly from the legacy Laravel export's serialized `features`
// field, not guessed), ordered by that real frequency, topped up with a
// handful of standard Australian real-estate feature terms (matching the
// vocabulary realestate.com.au listings commonly use — Ensuite, Ducted
// Heating/Cooling, Alarm System, Solar Panels, etc.) that don't appear in
// the historical data yet but are worth offering going forward. Hardcoded
// here deliberately — these are the site's fixed "core" suggestions, not
// something that grows from what admins type (see AmenitiesInput's own
// comment for why a per-listing custom tag never joins this list).
export const STANDARD_AMENITIES = [
  "Parking Area",
  "Air conditioning",
  "Laundry Room",
  "Built-in wardrobes",
  "Outdoor entertaining area",
  "Balcony",
  "Split-system air con",
  "Entertainment Area",
  "Living areas",
  "Broadband",
  "Large Lounge Room",
  "Emergency Exit",
  "Swimming Pool",
  "Courtyard Area",
  "Fire Alarm",
  "Fully fenced",
  "BBQ Area",
  "Furnished",
  "Split-system heating",
  "Central Heating",
  "Carport spaces",
  "Deck",
  "Fire Place",
  "Home Theater",
  "Next to busy way",
  "Ensuite",
  "Dishwasher",
  "Ducted Heating",
  "Ducted Cooling",
  "Study",
  "Alarm System",
  "Intercom",
  "Solar Panels",
  "Shed",
  "Remote Garage",
  "Rumpus Room",
  "Gym",
  "Ceiling Fans",
  "Water Tank",
  "Tennis Court",
] as const;

/**
 * A YouTube-tags-style input: selected amenities show as removable chips
 * inline with the text box; typing filters STANDARD_AMENITIES into a
 * dropdown (arrow keys + Enter, or a click, to pick one); Enter/comma on
 * text that matches nothing adds it as a one-off custom tag instead.
 * Focusing an empty box shows the full standard list first (nothing to
 * filter yet) so the common ones are still one click away, not just
 * reachable by typing.
 *
 * Still submits/reads the exact same `amenities` string[] the model and
 * the property page's checklist already expect — this only changes how an
 * admin builds that list. A custom tag (something typed that isn't on
 * STANDARD_AMENITIES) is saved on THIS listing's own `amenities` array only
 * — same as a YouTube video's tags are per-video, not added to some global
 * tag list — so it never appears as a suggestion on other listings. If a
 * tag turns out to be worth reusing site-wide, it belongs added to
 * STANDARD_AMENITIES above (a code change), not learned automatically.
 */
export function AmenitiesInput({ name, defaultValue }: { name: string; defaultValue?: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultValue ?? []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = (STANDARD_AMENITIES as readonly string[]).filter(
    (a) => !tags.includes(a) && (query.trim() === "" || a.toLowerCase().includes(query.trim().toLowerCase()))
  );

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setQuery("");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setQuery("");
    setActiveIndex(0);
    // Dropdown stays open (now showing the full remaining list, since query
    // just reset to "") so several tags can be added back-to-back without
    // re-opening it each time — matches how a tag input is normally used.
  }

  function removeTag(value: string) {
    setTags((prev) => prev.filter((t) => t !== value));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (open && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex]);
      } else if (query.trim()) {
        addTag(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && tags.length > 0) {
      // Matches the common tag-input convention (YouTube included):
      // backspace on an already-empty box deletes the last tag instead of
      // doing nothing.
      removeTag(tags[tags.length - 1]);
    }
  }

  // Any already-selected tag that isn't on the standard list (a rare
  // legacy one-off, or something typed in via the mobile "Add" box below)
  // — given its own row/chip on both layouts rather than disappearing,
  // same reasoning as the desktop dropdown excluding already-selected
  // items from its suggestions.
  const extraTags = tags.filter((t) => !(STANDARD_AMENITIES as readonly string[]).includes(t));

  return (
    <div>
      <input type="hidden" name={name} value={tags.join("\n")} />

      {/* Desktop/tablet: the search-and-tag combobox — hidden below `sm`.
          A dropdown that opens on focus and needs keyboard-arrow
          navigation is a fiddly, small-target interaction on a touch
          screen; a plain checkbox list (below) is the mobile-friendly
          equivalent of the exact same underlying `tags` state. */}
      <div className="relative hidden sm:block">
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex flex-wrap items-center gap-1.5 rounded border border-slate-300 bg-white px-2 py-1.5 focus-within:border-brand-navy focus-within:ring-1 focus-within:ring-brand-navy cursor-text"
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-brand-navy px-2.5 py-1 text-xs font-medium text-white"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="cursor-pointer leading-none text-white/80 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? "Type to search amenities, or add your own…" : "Add another…"}
            className="min-w-32 flex-1 border-none py-0.5 text-sm outline-none"
          />
        </div>

        {open && (suggestions.length > 0 || query.trim()) && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-slate-200 bg-white text-sm shadow-lg">
            {suggestions.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  // onMouseDown (not onClick) + preventDefault so this
                  // fires before the input's onBlur closes the dropdown —
                  // clicking an option would otherwise blur-close it a
                  // beat too early.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(s);
                  }}
                  className={`block w-full cursor-pointer px-3 py-1.5 text-left ${
                    i === activeIndex ? "bg-brand-navy text-white" : "hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              </li>
            ))}
            {query.trim() && !suggestions.some((s) => s.toLowerCase() === query.trim().toLowerCase()) && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(query);
                  }}
                  className="block w-full cursor-pointer px-3 py-1.5 text-left text-slate-600 hover:bg-slate-100"
                >
                  Add &quot;{query.trim()}&quot;
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Mobile: a plain checkbox per standard amenity, one per line —
          shown only below `sm`. Same `tags` state as the desktop combobox
          above, so switching layouts (resizing, rotating) never loses or
          duplicates a selection either way. */}
      <div className="sm:hidden">
        <div className="max-h-80 overflow-y-auto rounded border border-slate-300 bg-white divide-y divide-slate-100">
          {[...STANDARD_AMENITIES, ...extraTags].map((amenity) => (
            <label key={amenity} className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={tags.includes(amenity)}
                onChange={() => (tags.includes(amenity) ? removeTag(amenity) : addTag(amenity))}
                className="h-4 w-4 shrink-0 accent-brand-navy"
              />
              {amenity}
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(query);
              }
            }}
            placeholder="Add a feature not listed above…"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => addTag(query)}
            className="cursor-pointer rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default AmenitiesInput;
