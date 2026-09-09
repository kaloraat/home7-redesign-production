import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

/**
 * Shared MongoDB connection for the whole app (public site, admin, API routes,
 * server actions). Reused across hot-reloads in dev and across invocations in
 * serverless deploys so we don't open a new connection per request.
 */
export async function dbConnect() {
  if (cached.conn) return cached.conn;

  // Read this lazily, inside the function, rather than as a module-level
  // constant. ESM hoists `import` statements above other top-level code, so
  // a module-level constant here can end up capturing `undefined` if
  // something that loads .env files (dotenv, tsx, etc.) runs after this
  // module is first imported — which it often does, since the import that
  // pulls this file in is itself hoisted above the env-loading call.
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Copy .env.example to .env.local and set it."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
