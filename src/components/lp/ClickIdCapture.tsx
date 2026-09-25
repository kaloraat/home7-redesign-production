"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/lp/tracking";

/** Saves gclid/gbraid/wbraid/utm_* to a 90-day first-party cookie on landing. */
export function ClickIdCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
