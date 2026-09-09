"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TYPE_TO_PATH: Record<string, string> = {
  rent: "/properties-for-rent",
  sale: "/properties-for-sale",
  sold: "/sold-properties",
  leased: "/leased-properties",
};

export function HeroSearch() {
  const router = useRouter();
  const [type, setType] = useState("sale");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(TYPE_TO_PATH[type] ?? "/properties");
      }}
      className="mx-auto max-w-xl bg-white/10 border border-white/20 rounded-lg shadow-lg p-2 flex flex-col sm:flex-row gap-2"
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label="Property type"
        className="flex-1 cursor-pointer rounded-md border-0 bg-transparent px-4 py-3 text-lg font-medium text-white outline-none focus:outline-none focus:ring-0 [&>option]:text-brand-navy"
      >
        <option value="rent">For Rent</option>
        <option value="sale">For Sale</option>
        <option value="sold">Sold</option>
        <option value="leased">Leased</option>
      </select>
      <button
        type="submit"
        className="cursor-pointer rounded-md bg-brand-navy text-white text-lg font-semibold px-6 py-3 hover:brightness-110 transition"
      >
        Search Now
      </button>
    </form>
  );
}

export default HeroSearch;
