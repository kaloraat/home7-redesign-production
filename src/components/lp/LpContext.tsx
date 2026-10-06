"use client";

import { createContext, useContext } from "react";
import type { RegionKey } from "@/lib/lp/regions";
import type { LpLeadType } from "@/lib/lp/validation";

type Ctx = { leadType: LpLeadType; region: RegionKey };
const LpCtx = createContext<Ctx | null>(null);

export function LpProvider({ leadType, region, children }: Ctx & { children: React.ReactNode }) {
  return <LpCtx.Provider value={{ leadType, region }}>{children}</LpCtx.Provider>;
}

/** Inside an LP. Throws if used elsewhere so a missing provider can't mis-tag leads. */
export function useLp(): Ctx {
  const ctx = useContext(LpCtx);
  if (!ctx) throw new Error("useLp() must be used inside <LpProvider>");
  return ctx;
}

/** For components (PhoneLink) that also render on the main site. */
export const useLpOptional = () => useContext(LpCtx);
