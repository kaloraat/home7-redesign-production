"use client";

import { createContext, useContext } from "react";
import type { RegionKey } from "@/lib/lp/regions";
import type { LpLeadType } from "@/lib/lp/validation";

type Ctx = { leadType: LpLeadType; region: RegionKey };
const LpCtx = createContext<Ctx>({ leadType: "pm", region: "all" });

export function LpProvider({ leadType, region, children }: Ctx & { children: React.ReactNode }) {
  return <LpCtx.Provider value={{ leadType, region }}>{children}</LpCtx.Provider>;
}

export const useLp = () => useContext(LpCtx);
