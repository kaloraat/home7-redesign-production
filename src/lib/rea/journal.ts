import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

// The driver's own EJSON, via mongoose — no separate bson dependency.
const { EJSON } = mongoose.mongo.BSON;

/**
 * Undo log for sync writes. Before each change to a property, the record's
 * full previous state is appended here and the file is rewritten at once,
 * so even a run that crashes halfway can be rolled back. EJSON keeps
 * ObjectIds and Dates exact, so an undo restores records byte-for-byte.
 *
 *   update / delete → undo puts the saved record back
 *   insert          → undo deletes the record that was created
 */

type Doc = Record<string, unknown> & { _id: unknown };

interface JournalEntry {
  op: "update" | "delete" | "insert";
  id: unknown;
  before: Doc | null;
}

interface JournalFile {
  createdAt: string;
  note: string;
  entries: JournalEntry[];
}

export class Journal {
  private data: JournalFile;

  constructor(
    readonly file: string,
    note: string
  ) {
    this.data = { createdAt: new Date().toISOString(), note, entries: [] };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.flush();
  }

  record(op: JournalEntry["op"], id: unknown, before: Doc | null) {
    this.data.entries.push({ op, id, before });
    this.flush();
  }

  get size() {
    return this.data.entries.length;
  }

  private flush() {
    fs.writeFileSync(this.file, EJSON.stringify(this.data, undefined, 2, { relaxed: false }));
  }
}

const properties = () => mongoose.connection.collection("properties");

/** Saves every property, as-is, before a sync touches anything. */
export async function backupProperties(file: string): Promise<number> {
  const docs = await properties().find({}).toArray();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, EJSON.stringify(docs, undefined, 2, { relaxed: false }));
  return docs.length;
}

/** Reverses a journal, newest change first. */
export async function undoJournal(file: string): Promise<{ restored: number; removed: number }> {
  const data = EJSON.parse(fs.readFileSync(file, "utf8"), { relaxed: false }) as JournalFile;
  let restored = 0;
  let removed = 0;
  for (const e of [...data.entries].reverse()) {
    if (e.op === "insert") {
      await properties().deleteOne({ _id: e.id as never });
      removed++;
    } else if (e.before) {
      await properties().replaceOne({ _id: e.id as never }, e.before, { upsert: true });
      restored++;
    }
  }
  return { restored, removed };
}
