import type { ApplicationData, FileRef } from "./types";

/** Every uploaded file in an application (both applicants, all sections). */
export function applicationFiles(app: ApplicationData): FileRef[] {
  const out: FileRef[] = [...(app.about?.docs ?? [])];
  for (const p of [app.applicant, app.second]) {
    if (!p) continue;
    out.push(...p.finances.proof, ...(p.ids.photo?.files ?? []), ...(p.ids.second?.files ?? []));
  }
  return out;
}
